import { describe, expect, it } from "vitest";
import { buildChapterCards, type ChapterEventInput } from "../../../core/engine/journeyLibrary";
import { addDays } from "../../../core/day";
import { XP_SESSION_COMPLETE } from "../../../core/balance";
import type { EngineRawData, RawCompletedSession, RawDayLog } from "../../../core/engine/types";
import type { DayKey } from "../../../core/types";

const START: DayKey = "2026-01-01";

function session(dayKey: DayKey, labelId: number): RawCompletedSession {
  return { dayKey, labelId, source: "timer" };
}
function dayLog(dayKey: DayKey, journalText: string | null): RawDayLog {
  return { dayKey, hasJournalText: !!journalText, closedAtMs: null, mood: null, journalText };
}

function emptyRaw(overrides: Partial<EngineRawData> = {}): EngineRawData {
  return {
    profileStartedDayKey: START,
    labels: [{ id: 1, stat: "mind" }],
    habits: [],
    dailyTasks: [],
    completedSessions: [],
    habitEntries: [],
    dayLogs: [],
    weekReviews: [],
    ...overrides,
  };
}

describe("core/engine/journeyLibrary — buildChapterCards", () => {
  it("chưa từng chạm chương nào → đúng MỘT khung cho Chương 1, đang sống, không có snapshot", () => {
    const today = addDays(START, 10);
    const cards = buildChapterCards(emptyRaw(), [], 1, today);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      chapter: 1,
      reachedAtDayKey: START,
      isCurrent: true,
      peakNetWorthVnd: null,
    });
  });

  it("đã chạm Chương 2 → hai khung, Chương 1 KẾT THÚC đúng ngày trước khi Chương 2 bắt đầu", () => {
    const ch2Day = addDays(START, 20);
    const today = addDays(ch2Day, 5);
    const events: ChapterEventInput[] = [{ chapterIndex: 2, reachedAtDayKey: ch2Day, snapshotTotalVnd: 60_000_000 }];
    const cards = buildChapterCards(emptyRaw(), events, 2, today);
    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({ chapter: 1, isCurrent: false, peakNetWorthVnd: null });
    expect(cards[1]).toMatchObject({ chapter: 2, isCurrent: true, peakNetWorthVnd: 60_000_000 });
  });

  it("chương TRUNG GIAN bị nhảy qua trong cùng một lần nhập (reachedAtDayKey trùng chương kế) → 0 phiên, 0 dòng nhật ký, không lỗi", () => {
    const jumpDay = addDays(START, 5);
    const today = addDays(jumpDay, 1);
    // Nhảy thẳng 1 → 4: chương 2 và 3 có reachedAtDayKey TRÙNG chương 4 (cùng một lần nhập).
    const events: ChapterEventInput[] = [
      { chapterIndex: 2, reachedAtDayKey: jumpDay, snapshotTotalVnd: 300_000_000 },
      { chapterIndex: 3, reachedAtDayKey: jumpDay, snapshotTotalVnd: 300_000_000 },
      { chapterIndex: 4, reachedAtDayKey: jumpDay, snapshotTotalVnd: 300_000_000 },
    ];
    const raw = emptyRaw({ completedSessions: [session(jumpDay, 1)], dayLogs: [dayLog(jumpDay, "hello")] });
    const cards = buildChapterCards(raw, events, 4, today);
    expect(cards).toHaveLength(4);
    const [ch1, ch2, ch3, ch4] = cards;
    expect(ch2.totalSessions).toBe(0);
    expect(ch2.journalExcerpts).toEqual([]);
    expect(ch3.totalSessions).toBe(0);
    // Chương 1 kết thúc NGÀY TRƯỚC jumpDay — phiên/nhật ký của đúng jumpDay thuộc về Chương 4 (chương sống tại thời điểm đó).
    expect(ch1.totalSessions).toBe(0);
    expect(ch4.totalSessions).toBe(1);
    expect(ch4.journalExcerpts).toEqual(["hello"]);
  });

  it("tổng số phiên + trích nhật ký chỉ tính trong ĐÚNG khoảng thời gian của chương đó", () => {
    const ch2Day = addDays(START, 10);
    const today = addDays(ch2Day, 10);
    const raw = emptyRaw({
      completedSessions: [
        session(addDays(START, 2), 1), // trong Chương 1
        session(addDays(ch2Day, 1), 1), // trong Chương 2
      ],
      dayLogs: [dayLog(addDays(START, 3), "chapter one entry"), dayLog(addDays(ch2Day, 2), "chapter two entry")],
    });
    const events: ChapterEventInput[] = [{ chapterIndex: 2, reachedAtDayKey: ch2Day, snapshotTotalVnd: 50_000_000 }];
    const [ch1, ch2] = buildChapterCards(raw, events, 2, today);
    expect(ch1.totalSessions).toBe(1);
    expect(ch1.journalExcerpts).toEqual(["chapter one entry"]);
    expect(ch2.totalSessions).toBe(1);
    expect(ch2.journalExcerpts).toEqual(["chapter two entry"]);
  });

  it("trích nhật ký: MỚI NHẤT trước, cắt tối đa 3 dòng dù viết nhiều hơn", () => {
    const today = addDays(START, 10);
    const raw = emptyRaw({
      dayLogs: [
        dayLog(addDays(START, 1), "day1"),
        dayLog(addDays(START, 2), "day2"),
        dayLog(addDays(START, 3), "day3"),
        dayLog(addDays(START, 4), "day4"),
      ],
    });
    const [ch1] = buildChapterCards(raw, [], 1, today);
    expect(ch1.journalExcerpts).toEqual(["day4", "day3", "day2"]);
  });

  it("hình hài cuối Chương 1 KHÔNG bị 'rò' XP kiếm được sau khi đã sang Chương 2 — mỗi khung chỉ thấy XP tính TỚI HẾT chính chương đó", () => {
    const ch2Day = addDays(START, 5);
    // "Hôm nay" = ĐÚNG ch2Day (không thêm ngày nào nữa) — tránh decay ăn bớt XP vừa kiếm được,
    // phép so sánh này chỉ cần biết ĐÚNG ranh giới trước/sau ch2Day, không cần mô phỏng decay.
    const today = ch2Day;
    // 100 phiên = 3.000 XP, đủ đổi GIAI ĐOẠN (STAGE_XP_THRESHOLDS[1] = 3000) — đặt ĐÚNG vào
    // ch2Day (thuộc khoảng thời gian Chương 2, vì Chương 1 kết thúc NGÀY TRƯỚC ch2Day).
    const sessionsForStage2 = 3000 / XP_SESSION_COMPLETE; // 100
    const raw = emptyRaw({
      completedSessions: Array.from({ length: sessionsForStage2 }, () => session(ch2Day, 1)),
    });
    const events: ChapterEventInput[] = [{ chapterIndex: 2, reachedAtDayKey: ch2Day, snapshotTotalVnd: 50_000_000 }];
    const [ch1, ch2] = buildChapterCards(raw, events, 2, today);
    expect(ch1.characterStage).toBe(1); // Chương 1 kết thúc TRƯỚC ch2Day — vẫn giai đoạn 1
    expect(ch2.characterStage).toBe(2); // Chương 2 (đang sống, gồm cả ch2Day) đã thấy đủ 3.000 XP
  });
});
