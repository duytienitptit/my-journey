import { describe, expect, it } from "vitest";
import { isRestWell, xpEarnedForDay, type XpEarnedInput } from "../../../core/engine/xp";
import type { DailyTaskConfig } from "../../../core/engine/types";
import type { DayKey } from "../../../core/types";

const DAY = "2026-09-02" as DayKey;

const ENGLISH_TASK: DailyTaskConfig = { refType: "label", refId: 1, threshold: 4 };
const SPORT_TASK: DailyTaskConfig = { refType: "habit", refId: 10, threshold: 4 };
const JOURNAL_TASK: DailyTaskConfig = { refType: "habit", refId: 12, threshold: null };

function baseInput(overrides: Partial<XpEarnedInput> = {}): XpEarnedInput {
  return {
    completedSessionsToday: [],
    labelStatById: new Map([[1, "mind"]]),
    dailyTasks: [ENGLISH_TASK, SPORT_TASK, JOURNAL_TASK],
    habitStatById: new Map([
      [10, "health"],
      [12, "spirit"],
    ]),
    habitKindById: new Map([
      [10, "score_1_5"],
      [12, "journal"],
    ]),
    habitScoreByHabitId: new Map(),
    hasJournalText: false,
    closedToday: false,
    restWellToday: false,
    weekReviewWrittenToday: false,
    dayAchievedToday: false,
    ...overrides,
  };
}

describe("core/engine/xp — xpEarnedForDay, từng nguồn riêng (§4.4)", () => {
  it("không làm gì cả → 0 khắp nơi", () => {
    expect(xpEarnedForDay(baseInput())).toEqual({ mind: 0, health: 0, spirit: 0 });
  });

  it("hai phiên hoàn thành cùng nhãn → 2×30 vào đúng chỉ số của nhãn", () => {
    const input = baseInput({
      completedSessionsToday: [
        { dayKey: DAY, labelId: 1 },
        { dayKey: DAY, labelId: 1 },
      ],
    });
    expect(xpEarnedForDay(input).mind).toBe(60);
  });

  it("thói quen chấm đủ ngưỡng → +20 vào chỉ số của thói quen đó", () => {
    const input = baseInput({ habitScoreByHabitId: new Map([[10, 4]]) });
    expect(xpEarnedForDay(input).health).toBe(20);
  });

  it("thói quen chấm dưới ngưỡng → không có +20", () => {
    const input = baseInput({ habitScoreByHabitId: new Map([[10, 3]]) });
    expect(xpEarnedForDay(input).health).toBe(0);
  });

  it("nhãn đạt ngưỡng KHÔNG được +20 — chỉ thói quen mới có (§4.5 câu Q10)", () => {
    const input = baseInput({
      completedSessionsToday: [
        { dayKey: DAY, labelId: 1 },
        { dayKey: DAY, labelId: 1 },
        { dayKey: DAY, labelId: 1 },
        { dayKey: DAY, labelId: 1 },
      ],
    });
    // 4 phiên = 120 XP từ phiên, không có khoản +20 "giữ được" nào cộng thêm cho nhãn.
    expect(xpEarnedForDay(input).mind).toBe(120);
  });

  it("thói quen journal giữ được khi có chữ nhật ký, không đọc habitScoreByHabitId", () => {
    const input = baseInput({ hasJournalText: true });
    expect(xpEarnedForDay(input).spirit).toBe(20);
  });

  it("đóng ngày → +50 Spirit", () => {
    expect(xpEarnedForDay(baseInput({ closedToday: true })).spirit).toBe(50);
  });

  it("nghỉ ngơi đúng cách → +15 Health", () => {
    expect(xpEarnedForDay(baseInput({ restWellToday: true })).health).toBe(15);
  });

  it("viết đúc kết tuần → +100 Spirit", () => {
    expect(xpEarnedForDay(baseInput({ weekReviewWrittenToday: true })).spirit).toBe(100);
  });

  it("thưởng ngày đạt → +10 mỗi chỉ số (30 chia 3)", () => {
    const earned = xpEarnedForDay(baseInput({ dayAchievedToday: true }));
    expect(earned).toEqual({ mind: 10, health: 10, spirit: 10 });
  });

  it("cộng dồn nhiều nguồn cùng lúc — không có phép nhân/combo nào (§4.4)", () => {
    const input = baseInput({
      completedSessionsToday: [{ dayKey: DAY, labelId: 1 }],
      habitScoreByHabitId: new Map([[10, 5]]),
      hasJournalText: true,
      closedToday: true,
      restWellToday: true,
      dayAchievedToday: true,
    });
    const earned = xpEarnedForDay(input);
    // mind: 30 (phiên) + 10 (ngày đạt) = 40
    // health: 20 (sport giữ được) + 15 (nghỉ ngơi) + 10 (ngày đạt) = 45
    // spirit: 20 (journal giữ được) + 50 (đóng ngày) + 10 (ngày đạt) = 80
    expect(earned).toEqual({ mind: 40, health: 45, spirit: 80 });
  });
});

describe("core/engine/xp — isRestWell (§4.7)", () => {
  it("cả hai đạt ngưỡng ≥4 → nghỉ ngơi đúng cách", () => {
    expect(isRestWell(4, 4)).toBe(true);
  });

  it("trung bình đúng 4 (lệch nhau, ví dụ 5 và 3) → vẫn đạt", () => {
    expect(isRestWell(5, 3)).toBe(true);
  });

  it("trung bình dưới 4 → chưa đạt", () => {
    expect(isRestWell(3, 3)).toBe(false);
  });

  it("chưa chấm một trong hai (null) → tính là 0, kéo trung bình xuống", () => {
    expect(isRestWell(5, null)).toBe(false); // (5+0)/2 = 2.5 < 4
  });

  it("chưa chấm cả hai → chưa đạt", () => {
    expect(isRestWell(null, null)).toBe(false);
  });
});
