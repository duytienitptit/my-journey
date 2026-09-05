import { describe, expect, it } from "vitest";
import {
  habitKeepRatesForWeek,
  journalExcerptsForWeek,
  moodCurveForWeek,
  weeklySessionStats,
} from "../../../core/engine/weeklyStats";
import { addDays, weekOf } from "../../../core/day";
import type {
  DailyTaskConfig,
  HabitConfig,
  LabelConfig,
  RawCompletedSession,
  RawDayLog,
  RawHabitEntry,
} from "../../../core/engine/types";
import type { DayKey } from "../../../core/types";

const MONDAY: DayKey = "2026-08-03"; // Thứ Hai — khớp neo dùng ở timeline.test.ts
const WEEK = weekOf(MONDAY); // 7 ngày, Thứ Hai → Chủ nhật

const ENGLISH_ID = 1;
const DEEP_WORK_ID = 2;
const SPORT_ID = 10;
const SLEEP_ID = 11;
const JOURNAL_ID = 12;

const LABELS: LabelConfig[] = [
  { id: ENGLISH_ID, stat: "mind" },
  { id: DEEP_WORK_ID, stat: "mind" },
];
const HABITS: HabitConfig[] = [
  { id: SPORT_ID, slug: "sport", stat: "health", kind: "score_1_5" },
  { id: SLEEP_ID, slug: "sleep-enough", stat: "health", kind: "score_1_5" },
  { id: JOURNAL_ID, slug: "journal", stat: "spirit", kind: "journal" },
];
const DAILY_TASKS: DailyTaskConfig[] = [
  { refType: "habit", refId: SPORT_ID, threshold: 4 },
  { refType: "habit", refId: SLEEP_ID, threshold: 4 },
  { refType: "habit", refId: JOURNAL_ID, threshold: null },
];

function session(dayKey: DayKey, labelId: number, source: "timer" | "manual" = "timer"): RawCompletedSession {
  return { dayKey, labelId, source };
}
function dayLog(dayKey: DayKey, overrides: Partial<RawDayLog> = {}): RawDayLog {
  return { dayKey, hasJournalText: false, closedAtMs: null, mood: null, journalText: null, ...overrides };
}

describe("core/engine/weeklyStats — weeklySessionStats", () => {
  it("gộp đúng theo chỉ số của nhãn, chỉ tính phiên trong tuần đang xét", () => {
    const outsideWeek = addDays(WEEK[0], -1); // Chủ nhật tuần TRƯỚC — không được tính
    const sessions: RawCompletedSession[] = [
      session(WEEK[0], ENGLISH_ID),
      session(WEEK[1], ENGLISH_ID),
      session(WEEK[2], DEEP_WORK_ID),
      session(outsideWeek, ENGLISH_ID),
    ];
    const stats = weeklySessionStats(WEEK, sessions, LABELS);
    expect(stats.countByStat).toEqual({ mind: 3, health: 0, spirit: 0 });
    expect(stats.totalSessions).toBe(3);
  });

  it("% ghi bù = số phiên source=manual / tổng — 0 nếu chưa có phiên nào (tránh chia 0)", () => {
    expect(weeklySessionStats(WEEK, [], LABELS).backfillRate).toBe(0);

    const sessions: RawCompletedSession[] = [
      session(WEEK[0], ENGLISH_ID, "timer"),
      session(WEEK[0], ENGLISH_ID, "manual"),
      session(WEEK[1], ENGLISH_ID, "manual"),
      session(WEEK[1], ENGLISH_ID, "timer"),
    ];
    const stats = weeklySessionStats(WEEK, sessions, LABELS);
    expect(stats.backfilledSessions).toBe(2);
    expect(stats.totalSessions).toBe(4);
    expect(stats.backfillRate).toBe(0.5);
  });
});

describe("core/engine/weeklyStats — habitKeepRatesForWeek", () => {
  it("chỉ tính tới `todayKey` — tuần chưa hết thì mẫu số không phải 7", () => {
    const wednesday = WEEK[2];
    const rates = habitKeepRatesForWeek(WEEK, wednesday, DAILY_TASKS, HABITS, [], []);
    const sportRate = rates.find((r) => r.habitId === SPORT_ID);
    expect(sportRate?.consideredDays).toBe(3); // Thứ Hai, Ba, Tư
  });

  it("giữ được đúng ngưỡng daily_tasks (§4.5) — TÁI DÙNG y hệt isDailyTaskDone, không định nghĩa riêng", () => {
    const habitEntries: RawHabitEntry[] = [
      { dayKey: WEEK[0], habitId: SPORT_ID, score: 4, done: null }, // đạt (≥4)
      { dayKey: WEEK[1], habitId: SPORT_ID, score: 3, done: null }, // KHÔNG đạt (<4)
    ];
    const rates = habitKeepRatesForWeek(WEEK, WEEK[1], DAILY_TASKS, HABITS, habitEntries, []);
    const sportRate = rates.find((r) => r.habitId === SPORT_ID);
    expect(sportRate).toEqual({ habitId: SPORT_ID, keptDays: 1, consideredDays: 2, rate: 0.5 });
  });

  it("chưa chấm hôm đó → tính là CHƯA giữ được (0), không phải bỏ qua (§11.3 câu Q24)", () => {
    const rates = habitKeepRatesForWeek(WEEK, WEEK[0], DAILY_TASKS, HABITS, [], []);
    const sportRate = rates.find((r) => r.habitId === SPORT_ID);
    expect(sportRate).toEqual({ habitId: SPORT_ID, keptDays: 0, consideredDays: 1, rate: 0 });
  });

  it("thói quen journal giữ được khi CÓ CHỮ nhật ký hôm đó, không cần habit_entries", () => {
    const dayLogs: RawDayLog[] = [dayLog(WEEK[0], { hasJournalText: true })];
    const rates = habitKeepRatesForWeek(WEEK, WEEK[0], DAILY_TASKS, HABITS, [], dayLogs);
    const journalRate = rates.find((r) => r.habitId === JOURNAL_ID);
    expect(journalRate).toEqual({ habitId: JOURNAL_ID, keptDays: 1, consideredDays: 1, rate: 1 });
  });

  it("chỉ trả về thói quen kiểu HABIT trong daily_tasks — không lẫn nhãn (label)", () => {
    const tasksWithLabel: DailyTaskConfig[] = [...DAILY_TASKS, { refType: "label", refId: ENGLISH_ID, threshold: 4 }];
    const rates = habitKeepRatesForWeek(WEEK, WEEK[0], tasksWithLabel, HABITS, [], []);
    expect(rates.map((r) => r.habitId).sort()).toEqual([SPORT_ID, SLEEP_ID, JOURNAL_ID].sort());
  });
});

describe("core/engine/weeklyStats — moodCurveForWeek", () => {
  it("đủ 7 ngày theo đúng thứ tự Thứ Hai → Chủ nhật, null cho ngày chưa chấm", () => {
    const dayLogs: RawDayLog[] = [dayLog(WEEK[0], { mood: 4 }), dayLog(WEEK[3], { mood: 2 })];
    const curve = moodCurveForWeek(WEEK, dayLogs);
    expect(curve).toHaveLength(7);
    expect(curve.map((d) => d.dayKey)).toEqual(WEEK);
    expect(curve[0].mood).toBe(4);
    expect(curve[3].mood).toBe(2);
    expect(curve[1].mood).toBeNull();
  });
});

describe("core/engine/weeklyStats — journalExcerptsForWeek", () => {
  it("chỉ trả về ngày CÓ chữ nhật ký, theo đúng thứ tự trong tuần", () => {
    const dayLogs: RawDayLog[] = [
      dayLog(WEEK[0], { journalText: "hôm nay ổn" }),
      dayLog(WEEK[1], { journalText: "   " }), // chỉ khoảng trắng — coi như trống
      dayLog(WEEK[2], { journalText: null }),
      dayLog(WEEK[4], { journalText: "một ngày dài" }),
    ];
    const excerpts = journalExcerptsForWeek(WEEK, dayLogs);
    expect(excerpts).toEqual([
      { dayKey: WEEK[0], text: "hôm nay ổn" },
      { dayKey: WEEK[4], text: "một ngày dài" },
    ]);
  });
});
