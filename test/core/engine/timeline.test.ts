import { describe, expect, it } from "vitest";
import { foldTimeline } from "../../../core/engine/timeline";
import { xpRequiredForLevel } from "../../../core/engine/levels";
import { addDays, enumerateDayKeys, isoWeekdayOf, startOfDayMs } from "../../../core/day";
import {
  STREAK_DAY_ACHIEVED_MILESTONES,
  STREAK_JOURNAL_MILESTONES,
  WEEK_PERFECT_BONUS,
  XP_SESSION_COMPLETE,
  XP_WEEK_REVIEW,
} from "../../../core/balance";
import type {
  DailyTaskConfig,
  EngineRawData,
  HabitConfig,
  LabelConfig,
  RawCompletedSession,
  RawDayLog,
  RawHabitEntry,
  RawWeekReview,
} from "../../../core/engine/types";
import type { DayKey } from "../../../core/types";

// ─── Dữ liệu khởi đầu — khớp seed thật (db/seed.ts) ────────────────────────
const ENGLISH_ID = 1;
const DEEP_WORK_ID = 2;
const NEW_KNOWLEDGE_ID = 3;
const SPORT_ID = 10;
const SLEEP_ID = 11;
const JOURNAL_ID = 12;

const LABELS: LabelConfig[] = [
  { id: ENGLISH_ID, stat: "mind" },
  { id: DEEP_WORK_ID, stat: "mind" },
  { id: NEW_KNOWLEDGE_ID, stat: "mind" },
];
const HABITS: HabitConfig[] = [
  { id: SPORT_ID, slug: "sport", stat: "health", kind: "score_1_5" },
  { id: SLEEP_ID, slug: "sleep-enough", stat: "health", kind: "score_1_5" },
  { id: JOURNAL_ID, slug: "journal", stat: "spirit", kind: "journal" },
];
const DAILY_TASKS: DailyTaskConfig[] = [
  { refType: "label", refId: ENGLISH_ID, threshold: 4 },
  { refType: "label", refId: DEEP_WORK_ID, threshold: 4 },
  { refType: "label", refId: NEW_KNOWLEDGE_ID, threshold: 2 },
  { refType: "habit", refId: SPORT_ID, threshold: 4 },
  { refType: "habit", refId: SLEEP_ID, threshold: 4 },
  { refType: "habit", refId: JOURNAL_ID, threshold: null },
];

function emptyRaw(profileStartedDayKey: DayKey): EngineRawData {
  return {
    profileStartedDayKey,
    labels: LABELS,
    habits: HABITS,
    dailyTasks: DAILY_TASKS,
    completedSessions: [],
    habitEntries: [],
    dayLogs: [],
    weekReviews: [],
  };
}

/** Cách "đạt" RẺ NHẤT cho một ngày, tuỳ thứ — khớp minh hoạ trong SPEC.md §4.5. */
function achievedDayFixture(dayKey: DayKey): {
  sessions: RawCompletedSession[];
  habitEntries: RawHabitEntry[];
  dayLog: RawDayLog;
} {
  const weekday = isoWeekdayOf(dayKey);
  const dayLog: RawDayLog = { dayKey, hasJournalText: true, closedAtMs: null };
  if (weekday === 7) return { sessions: [], habitEntries: [], dayLog }; // Chủ nhật: chỉ cần nhật ký

  const habitEntries: RawHabitEntry[] = [
    { dayKey, habitId: SPORT_ID, score: 4, done: null },
    { dayKey, habitId: SLEEP_ID, score: 4, done: null },
  ];
  const sessions: RawCompletedSession[] =
    weekday === 6
      ? [] // Thứ Bảy: 3 thói quen rẻ (sport+sleep+journal) là đủ 3/6
      : [
          { dayKey, labelId: NEW_KNOWLEDGE_ID },
          { dayKey, labelId: NEW_KNOWLEDGE_ID },
        ];
  return { sessions, habitEntries, dayLog };
}

/** TRỌN VẸN cả 6 việc, bất kể thứ mấy — khác `achievedDayFixture` (rẻ nhất theo thứ). Dùng để
 *  "cứu" chuỗi ngày-đạt sau 1 ngày ân hạn (§4.6, [CHỐT — 2026-09-04]). */
function perfectDayFixture(dayKey: DayKey): {
  sessions: RawCompletedSession[];
  habitEntries: RawHabitEntry[];
  dayLog: RawDayLog;
} {
  return {
    sessions: [
      ...Array.from({ length: 4 }, () => ({ dayKey, labelId: ENGLISH_ID })),
      ...Array.from({ length: 4 }, () => ({ dayKey, labelId: DEEP_WORK_ID })),
      ...Array.from({ length: 2 }, () => ({ dayKey, labelId: NEW_KNOWLEDGE_ID })),
    ],
    habitEntries: [
      { dayKey, habitId: SPORT_ID, score: 4, done: null },
      { dayKey, habitId: SLEEP_ID, score: 4, done: null },
    ],
    dayLog: { dayKey, hasJournalText: true, closedAtMs: null },
  };
}

/** Gộp nhiều `achievedDayFixture` liên tiếp thành một `EngineRawData`. */
function rawFromAchievedRange(startKey: DayKey, endKey: DayKey): EngineRawData {
  const days = enumerateDayKeys(startKey, endKey);
  const sessions: RawCompletedSession[] = [];
  const habitEntries: RawHabitEntry[] = [];
  const dayLogs: RawDayLog[] = [];
  for (const day of days) {
    const f = achievedDayFixture(day);
    sessions.push(...f.sessions);
    habitEntries.push(...f.habitEntries);
    dayLogs.push(f.dayLog);
  }
  return { ...emptyRaw(startKey), completedSessions: sessions, habitEntries, dayLogs };
}

function endOfDayMs(dayKey: DayKey): number {
  return startOfDayMs(addDays(dayKey, 1)) - 1;
}

const START: DayKey = "2026-08-03"; // Thứ Hai (kiểm bằng isoWeekdayOf trong test đầu tiên)

describe("core/engine/timeline — nền tảng", () => {
  it("2026-08-03 đúng là Thứ Hai, để mọi test dưới đây có điểm neo đúng", () => {
    expect(isoWeekdayOf(START)).toBe(1);
  });

  it("chưa có bản ghi nào — mọi thứ ở mức khởi đầu", () => {
    const result = foldTimeline(emptyRaw(START), endOfDayMs(START));
    expect(result.xpByStat).toEqual({ mind: 0, health: 0, spirit: 0 });
    expect(result.levelByStat).toEqual({ mind: 0, health: 0, spirit: 0 });
    expect(result.stage).toBe(1);
    expect(result.dayAchievedStreak).toEqual({ current: 0, longest: 0, danger: false });
    expect(result.journalStreak).toEqual({ current: 0, longest: 0 });
  });
});

describe("core/engine/timeline — XP tính SỐNG ngay trong ngày (không chờ)", () => {
  it("một phiên hoàn thành hôm nay → XP cộng ngay, dù hôm nay chưa 'chốt'", () => {
    const raw = emptyRaw(START);
    raw.completedSessions = [{ dayKey: START, labelId: ENGLISH_ID }];
    const result = foldTimeline(raw, endOfDayMs(START));
    expect(result.xpByStat.mind).toBe(XP_SESSION_COMPLETE);
  });

  it("nhiều phiên cùng nhãn cộng dồn đúng", () => {
    const raw = emptyRaw(START);
    raw.completedSessions = Array.from({ length: 4 }, () => ({ dayKey: START, labelId: DEEP_WORK_ID }));
    const result = foldTimeline(raw, endOfDayMs(START));
    // 4 phiên Deep work đủ ngưỡng "ngày đạt" cho Deep work — nhưng chưa đủ 4/6 việc trong ngày
    // (chỉ 1 việc đạt), nên KHÔNG có +30 thưởng ngày đạt, chỉ có 4×30=120 từ phiên.
    expect(result.xpByStat.mind).toBe(4 * XP_SESSION_COMPLETE);
  });
});

describe("core/engine/timeline — thói quen giữ được, chỉ áp cho habit trong 6 việc", () => {
  it("Sport chấm đủ ngưỡng → +20 Health, English/Deep work không có khoản này dù đạt ngưỡng", () => {
    const raw = emptyRaw(START);
    raw.habitEntries = [{ dayKey: START, habitId: SPORT_ID, score: 4, done: null }];
    raw.completedSessions = Array.from({ length: 4 }, () => ({ dayKey: START, labelId: ENGLISH_ID }));
    const result = foldTimeline(raw, endOfDayMs(START));
    expect(result.xpByStat.health).toBe(20); // chỉ +20 giữ được, KHÔNG có ngày đạt (mới 2/6)
    expect(result.xpByStat.mind).toBe(4 * XP_SESSION_COMPLETE); // chỉ tiền phiên, không +20 nào
  });
});

describe("core/engine/timeline — thưởng ngày đạt (+30, chia đều, §11.4 câu T1)", () => {
  it("đúng 4/6 việc (Thứ Hai) → +30 chia đều 10/10/10, cộng vào tổng đã có", () => {
    const day2 = addDays(START, 1); // Thứ Ba
    const raw = emptyRaw(START);
    const f = achievedDayFixture(day2);
    raw.completedSessions = f.sessions;
    raw.habitEntries = f.habitEntries;
    raw.dayLogs = [f.dayLog];
    const result = foldTimeline(raw, endOfDayMs(day2));
    // mind: 2 phiên New knowledge (60) + 10 (chia thưởng) = 70
    // health: sport(20) + sleep(20) + nghỉ ngơi(15, vì (4+4)/2=4≥4) + 10 = 65
    // spirit: journal giữ được(20) + 10 = 30
    expect(result.xpByStat).toEqual({ mind: 70, health: 65, spirit: 30 });
  });
});

describe("core/engine/timeline — decay khi bỏ bê (§4.1)", () => {
  it("mind đạt cấp 1 rồi im lặng 5 ngày liên tiếp — decay đúng từ ngày thứ 4", () => {
    const raw = emptyRaw(START);
    const sessionsNeeded = xpRequiredForLevel(1) / XP_SESSION_COMPLETE; // 10 phiên = 300 XP = cấp 1
    raw.completedSessions = Array.from({ length: sessionsNeeded }, () => ({
      dayKey: START,
      labelId: ENGLISH_ID,
    }));
    const day5 = addDays(START, 5); // 5 ngày sau, mind im lặng suốt
    const result = foldTimeline(raw, endOfDayMs(day5));
    // Ngày 1,2,3 sau START không trừ (còn hạn). Ngày 4, ngày 5 mới trừ, mỗi ngày 20×cấp-tại-lúc-đó.
    // xp=300 (cấp 1) -> ngày4: trừ 20*1=20 -> 280 (cấp 0, vì 280<300)
    //                -> ngày5: trừ 20*max(1,0)=20 -> 260
    expect(result.xpByStat.mind).toBe(260);
    expect(result.levelByStat.mind).toBe(0);
  });

  it("chỉ số vẫn hoạt động (nhận XP đều) thì KHÔNG bị decay", () => {
    const raw = rawFromAchievedRange(START, addDays(START, 10));
    const result = foldTimeline(raw, endOfDayMs(addDays(START, 10)));
    // Có hoạt động habit mỗi ngày (sport/sleep/journal) nên health, spirit không im lặng ngày
    // nào — decay không áp dụng, XP chỉ tăng.
    expect(result.xpByStat.health).toBeGreaterThan(0);
    expect(result.xpByStat.spirit).toBeGreaterThan(0);
  });

  it("sàn 0 — không bao giờ âm dù im lặng rất lâu", () => {
    const raw = emptyRaw(START);
    raw.completedSessions = [{ dayKey: START, labelId: ENGLISH_ID }]; // chỉ 30 XP, cấp 0
    const farFuture = addDays(START, 60);
    const result = foldTimeline(raw, endOfDayMs(farFuture));
    expect(result.xpByStat.mind).toBe(0); // 30 XP ban đầu, cấp 0 → trừ 20/ngày, hết rất nhanh, sàn ở 0
  });
});

describe("core/engine/timeline — chuỗi ngày-đạt: hiển thị tính tới hết hôm qua (§4.6)", () => {
  it("hôm nay vừa đạt lần đầu — chuỗi HIỂN THỊ vẫn là 0 cho tới sáng mai", () => {
    const raw = rawFromAchievedRange(START, START); // chỉ 1 ngày, đúng hôm nay, vừa đạt
    const result = foldTimeline(raw, endOfDayMs(START));
    expect(result.dayAchievedStreak.current).toBe(0); // chưa "tính" — còn đang là hôm nay
  });

  it("3 ngày liên tiếp đạt, hôm sau (ngày thứ 4, đang xét 'hôm nay') → hiển thị current=3", () => {
    const day3 = addDays(START, 2);
    const day4 = addDays(START, 3); // "hôm nay" — chưa làm gì
    const raw = rawFromAchievedRange(START, day3);
    const result = foldTimeline(raw, endOfDayMs(day4));
    expect(result.dayAchievedStreak.current).toBe(3); // 3 ngày (START..day3) đã tính, day4 (hôm nay) chưa
  });

});

describe("core/engine/timeline — chuỗi ngày-đạt: MỘT NGÀY ÂN HẠN trước khi gãy thật (§4.6, [CHỐT — 2026-09-04])", () => {
  it("bỏ 1 ngày sau khi đã có chuỗi → vào 'nguy hiểm', số hiện tại CHƯA mất", () => {
    const day3 = addDays(START, 2); // đạt 3 ngày liên tiếp: START, +1, +2 → current=3
    const missDay = addDays(START, 3); // Thứ Năm — không có dữ liệu gì, bỏ hẳn
    const raw = rawFromAchievedRange(START, day3);
    // Đánh giá ở ngày KẾ TIẾP missDay, để missDay đã "chốt" (không còn là hôm nay của phép tính).
    const dayAfterMiss = addDays(missDay, 1);
    const result = foldTimeline(raw, endOfDayMs(dayAfterMiss));
    expect(result.dayAchievedStreak).toEqual({ current: 3, longest: 3, danger: true });
  });

  it("cứu được — ngày kế tiếp đủ CẢ 6 việc (không chỉ ngưỡng 'đạt' thường) → nối tiếp như chưa từng bỏ", () => {
    const day3 = addDays(START, 2);
    const missDay = addDays(START, 3); // Thứ Năm, bỏ hẳn → vào nguy hiểm
    const rescueDay = addDays(missDay, 1); // Thứ Sáu, TRỌN VẸN 6/6 → cứu
    const base = rawFromAchievedRange(START, day3);
    const rescue = perfectDayFixture(rescueDay);
    const raw: EngineRawData = {
      ...base,
      completedSessions: [...base.completedSessions, ...rescue.sessions],
      habitEntries: [...base.habitEntries, ...rescue.habitEntries],
      dayLogs: [...base.dayLogs, rescue.dayLog],
    };
    // Đánh giá ở ngày SAU rescueDay, để rescueDay đã chốt.
    const result = foldTimeline(raw, endOfDayMs(addDays(rescueDay, 1)));
    // Ngày bỏ không tính (+0), ngày cứu tính +1 bình thường — 3 → 4, y hệt không hề gián đoạn.
    expect(result.dayAchievedStreak).toEqual({ current: 4, longest: 4, danger: false });
  });

  it("không cứu được — ngày kế tiếp KHÔNG đủ 6/6 (kể cả nếu vẫn đạt ngưỡng thường) → gãy thật, về 0", () => {
    const day3 = addDays(START, 2);
    const missDay = addDays(START, 3); // Thứ Năm, bỏ hẳn → vào nguy hiểm
    const notEnoughDay = addDays(missDay, 1); // Thứ Sáu — chỉ đạt NGƯỠNG THƯỜNG (4/6), không đủ 6/6
    const base = rawFromAchievedRange(START, day3);
    const cheap = achievedDayFixture(notEnoughDay); // "rẻ nhất" — không đụng English/Deep work
    const raw: EngineRawData = {
      ...base,
      completedSessions: [...base.completedSessions, ...cheap.sessions],
      habitEntries: [...base.habitEntries, ...cheap.habitEntries],
      dayLogs: [...base.dayLogs, cheap.dayLog],
    };
    const result = foldTimeline(raw, endOfDayMs(addDays(notEnoughDay, 1)));
    expect(result.dayAchievedStreak).toEqual({ current: 0, longest: 3, danger: false });
  });

  it("chưa có chuỗi nào (current=0) mà bỏ 1 ngày — KHÔNG vào nguy hiểm, không có gì để cứu", () => {
    const raw = emptyRaw(START); // không có bản ghi nào — bỏ luôn từ đầu
    const result = foldTimeline(raw, endOfDayMs(addDays(START, 1)));
    expect(result.dayAchievedStreak).toEqual({ current: 0, longest: 0, danger: false });
  });

  it("đang nguy hiểm mà ngày cứu CŨNG bỏ luôn (không chỉ thiếu điểm) — gãy thật ngay, không lùi thêm hạn", () => {
    const day3 = addDays(START, 2);
    const missDay = addDays(START, 3); // vào nguy hiểm
    const alsoMissDay = addDays(missDay, 1); // bỏ tiếp, không có gì cả — không phải "ân hạn dây chuyền"
    const raw = rawFromAchievedRange(START, day3);
    const result = foldTimeline(raw, endOfDayMs(addDays(alsoMissDay, 1)));
    expect(result.dayAchievedStreak).toEqual({ current: 0, longest: 3, danger: false });
  });

  it("chuỗi nhật ký KHÔNG có ân hạn — bỏ viết 1 ngày là về 0 ngay, đúng luật cũ", () => {
    // 7 ngày chỉ viết nhật ký (không làm gì khác) để dựng chuỗi nhật ký thuần, không đụng chuỗi ngày-đạt.
    const raw = emptyRaw(START);
    const days = enumerateDayKeys(START, addDays(START, 2));
    raw.dayLogs = days.map((d) => ({ dayKey: d, hasJournalText: true, closedAtMs: null }));
    const missDay = addDays(START, 3); // không viết — chuỗi nhật ký phải gãy ngay, không ân hạn
    const result = foldTimeline(raw, endOfDayMs(addDays(missDay, 1)));
    expect(result.journalStreak).toEqual({ current: 0, longest: 3 }); // vẫn StreakInfo trơn, không có "danger"
  });
});

describe("core/engine/timeline — thưởng mốc chuỗi, một lần trong đời (§4.6)", () => {
  it("chạm đúng mốc 7 ngày đạt liên tiếp → +150 chia đều, xuất hiện trong events", () => {
    const day7 = addDays(START, 6); // 7 ngày: START..day7
    const raw = rawFromAchievedRange(START, day7);
    const dayAfter = addDays(day7, 1); // qua "hôm nay" để mốc chuỗi chắc chắn đã tính (dù mốc XP là sống, không cần chờ, nhưng đọc kết quả sau khi mọi thứ đã fold xong)
    const result = foldTimeline(raw, endOfDayMs(dayAfter));
    const milestoneEvents = result.events.streakMilestones.filter((e) => e.kind === "dayAchieved");
    expect(milestoneEvents).toHaveLength(1);
    expect(milestoneEvents[0]).toMatchObject({ milestone: 7, xpAwarded: STREAK_DAY_ACHIEVED_MILESTONES[7] });
  });

  it("gãy rồi xây lại đúng 7 ngày lần nữa — KHÔNG thưởng lại (đã thưởng một lần trong đời)", () => {
    const day7 = addDays(START, 6);
    const breakDay = addDays(day7, 1); // gãy — không đạt gì ngày này
    const rebuildStart = addDays(breakDay, 1);
    const rebuildEnd = addDays(rebuildStart, 6); // 7 ngày nữa

    const raw = emptyRaw(START);
    const firstStretch = rawFromAchievedRange(START, day7);
    const secondStretch = rawFromAchievedRange(rebuildStart, rebuildEnd);
    raw.completedSessions = [...firstStretch.completedSessions, ...secondStretch.completedSessions];
    raw.habitEntries = [...firstStretch.habitEntries, ...secondStretch.habitEntries];
    raw.dayLogs = [...firstStretch.dayLogs, ...secondStretch.dayLogs];

    const result = foldTimeline(raw, endOfDayMs(addDays(rebuildEnd, 1)));
    const milestoneEvents = result.events.streakMilestones.filter(
      (e) => e.kind === "dayAchieved" && e.milestone === 7,
    );
    expect(milestoneEvents).toHaveLength(1); // chỉ một lần, dù chạm mốc 7 hai lần trong đời
  });

  it("chuỗi nhật ký độc lập với chuỗi ngày-đạt — chỉ viết nhật ký 7 ngày, không làm gì khác", () => {
    const day7 = addDays(START, 6);
    const days = enumerateDayKeys(START, day7);
    const raw = emptyRaw(START);
    raw.dayLogs = days.map((d) => ({ dayKey: d, hasJournalText: true, closedAtMs: null }));

    const result = foldTimeline(raw, endOfDayMs(addDays(day7, 1)));
    const journalMilestones = result.events.streakMilestones.filter((e) => e.kind === "journal");
    expect(journalMilestones).toEqual([
      { dayKey: day7, kind: "journal", milestone: 7, xpAwarded: STREAK_JOURNAL_MILESTONES[7] },
    ]);
    // Chỉ viết nhật ký thôi thì KHÔNG đạt ngày nào (Thứ Hai-Thứ Sáu cần 4/6, Thứ Bảy cần 3/6) —
    // chuỗi ngày-đạt phải bằng 0, chứng minh hai chuỗi hoàn toàn tách biệt (§4.6).
    expect(result.events.streakMilestones.some((e) => e.kind === "dayAchieved")).toBe(false);
  });
});

describe("core/engine/timeline — thưởng tuần trọn vẹn (§4.6)", () => {
  it("cả 7 ngày trong tuần đạt + viết đúc kết (sau khi tuần đã qua) → +200 Spirit", () => {
    // START = Thứ Hai, nên START..START+6 là một tuần trọn (Thứ Hai → Chủ nhật).
    const sunday = addDays(START, 6);
    const raw = rawFromAchievedRange(START, sunday);
    const reviewWrittenDay = addDays(sunday, 1); // viết đúc kết vào Thứ Hai tuần sau
    const review: RawWeekReview = { weekStart: START, createdAtDayKey: reviewWrittenDay };
    raw.weekReviews = [review];

    const withoutReview = foldTimeline(
      { ...raw, weekReviews: [] },
      endOfDayMs(reviewWrittenDay),
    ).xpByStat.spirit;
    const withReview = foldTimeline(raw, endOfDayMs(reviewWrittenDay)).xpByStat.spirit;

    // Viết đúc kết LUÔN được +100 (XP_WEEK_REVIEW, §4.4) bất kể tuần có trọn vẹn không — cộng
    // thêm +200 riêng (WEEK_PERFECT_BONUS) vì tuần này đạt cả 7 ngày. Hai khoản độc lập.
    expect(withReview - withoutReview).toBe(XP_WEEK_REVIEW + WEEK_PERFECT_BONUS);
  });

  it("thiếu 1 ngày trong tuần (Thứ Bảy không đạt) → không có +200 dù có viết đúc kết", () => {
    const sunday = addDays(START, 6);
    const saturday = addDays(START, 5);
    const raw = rawFromAchievedRange(START, sunday);
    // Xoá dữ liệu của riêng Thứ Bảy để ngày đó KHÔNG đạt.
    raw.habitEntries = raw.habitEntries.filter((e) => e.dayKey !== saturday);
    raw.dayLogs = raw.dayLogs.map((d) => (d.dayKey === saturday ? { ...d, hasJournalText: false } : d));

    const reviewWrittenDay = addDays(sunday, 1);
    raw.weekReviews = [{ weekStart: START, createdAtDayKey: reviewWrittenDay }];

    const withReview = foldTimeline(raw, endOfDayMs(reviewWrittenDay)).xpByStat.spirit;
    const withoutReview = foldTimeline(
      { ...raw, weekReviews: [] },
      endOfDayMs(reviewWrittenDay),
    ).xpByStat.spirit;
    // Viết đúc kết vẫn được +100 dù tuần không trọn vẹn — chỉ THIẾU khoản +200 riêng.
    expect(withReview - withoutReview).toBe(XP_WEEK_REVIEW);
  });
});

describe("core/engine/timeline — sự kiện lên cấp và đổi giai đoạn", () => {
  it("đủ 300 XP trong một ngày (10 phiên) → sự kiện lên cấp 0 → 1", () => {
    const raw = emptyRaw(START);
    raw.completedSessions = Array.from({ length: 10 }, () => ({ dayKey: START, labelId: ENGLISH_ID }));
    const result = foldTimeline(raw, endOfDayMs(START));
    expect(result.levelByStat.mind).toBe(1);
    expect(result.events.levelUps).toContainEqual({
      dayKey: START,
      stat: "mind",
      fromLevel: 0,
      toLevel: 1,
    });
  });

  it("tụt cấp cũng phát sự kiện (fromLevel cao hơn toLevel)", () => {
    const raw = emptyRaw(START);
    const sessionsNeeded = xpRequiredForLevel(1) / XP_SESSION_COMPLETE;
    raw.completedSessions = Array.from({ length: sessionsNeeded }, () => ({
      dayKey: START,
      labelId: ENGLISH_ID,
    }));
    const day5 = addDays(START, 5);
    const result = foldTimeline(raw, endOfDayMs(day5));
    const dropEvent = result.events.levelUps.find((e) => e.stat === "mind" && e.toLevel < e.fromLevel);
    expect(dropEvent).toBeDefined();
  });
});

describe("core/engine/timeline — sàn XP không bao giờ âm dù nhiều chỉ số cùng bị bỏ bê", () => {
  it("cả ba chỉ số đều 0 XP và im lặng lâu — không có gì âm, không crash", () => {
    const raw = emptyRaw(START);
    const result = foldTimeline(raw, endOfDayMs(addDays(START, 100)));
    expect(result.xpByStat).toEqual({ mind: 0, health: 0, spirit: 0 });
    expect(result.totalXp).toBe(0);
    expect(result.stage).toBe(1);
  });
});
