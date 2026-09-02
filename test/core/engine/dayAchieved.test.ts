import { describe, expect, it } from "vitest";
import { isDailyTaskDone, isDayAchieved } from "../../../core/engine/dayAchieved";
import type { DailyTaskConfig } from "../../../core/engine/types";
import type { DayKey } from "../../../core/types";

// Nhắc lại từ test/core/day.test.ts: 2026-09-02 = Thứ Tư. Suy ra 2026-09-05 = Thứ Bảy,
// 2026-09-06 = Chủ nhật, 2026-08-31 = Thứ Hai.
const MONDAY = "2026-08-31" as DayKey;
const WEDNESDAY = "2026-09-02" as DayKey;
const SATURDAY = "2026-09-05" as DayKey;
const SUNDAY = "2026-09-06" as DayKey;

const ENGLISH_TASK: DailyTaskConfig = { refType: "label", refId: 1, threshold: 4 };
const DEEP_WORK_TASK: DailyTaskConfig = { refType: "label", refId: 2, threshold: 4 };
const NEW_KNOWLEDGE_TASK: DailyTaskConfig = { refType: "label", refId: 3, threshold: 2 };
const SPORT_TASK: DailyTaskConfig = { refType: "habit", refId: 10, threshold: 4 };
const SLEEP_TASK: DailyTaskConfig = { refType: "habit", refId: 11, threshold: 4 };
const JOURNAL_TASK: DailyTaskConfig = { refType: "habit", refId: 12, threshold: null };

const SIX_TASKS = [
  ENGLISH_TASK,
  DEEP_WORK_TASK,
  NEW_KNOWLEDGE_TASK,
  SPORT_TASK,
  SLEEP_TASK,
  JOURNAL_TASK,
];

describe("core/engine/dayAchieved — isDailyTaskDone", () => {
  const base = {
    dayKey: WEDNESDAY,
    dailyTasks: SIX_TASKS,
    journalHabitId: 12,
  };

  it("nhãn đủ ngưỡng phiên → đạt", () => {
    const input = {
      ...base,
      completedSessionCountByLabelId: new Map([[1, 4]]),
      habitScoreByHabitId: new Map(),
      hasJournalText: false,
    };
    expect(isDailyTaskDone(ENGLISH_TASK, input)).toBe(true);
  });

  it("nhãn thiếu 1 phiên → chưa đạt", () => {
    const input = {
      ...base,
      completedSessionCountByLabelId: new Map([[1, 3]]),
      habitScoreByHabitId: new Map(),
      hasJournalText: false,
    };
    expect(isDailyTaskDone(ENGLISH_TASK, input)).toBe(false);
  });

  it("thói quen chấm đủ điểm → đạt", () => {
    const input = {
      ...base,
      completedSessionCountByLabelId: new Map(),
      habitScoreByHabitId: new Map([[10, 4]]),
      hasJournalText: false,
    };
    expect(isDailyTaskDone(SPORT_TASK, input)).toBe(true);
  });

  it("chưa chấm điểm thói quen hôm đó → tính là 0, chưa đạt (§11.3 câu Q24)", () => {
    const input = {
      ...base,
      completedSessionCountByLabelId: new Map(),
      habitScoreByHabitId: new Map(), // không có entry cho habitId 10
      hasJournalText: false,
    };
    expect(isDailyTaskDone(SPORT_TASK, input)).toBe(false);
  });

  it("thói quen journal (threshold null) đọc hasJournalText, không đọc habitScoreByHabitId", () => {
    const input = {
      ...base,
      completedSessionCountByLabelId: new Map(),
      habitScoreByHabitId: new Map([[12, 0]]), // dù có rác ở đây cũng không được đọc
      hasJournalText: true,
    };
    expect(isDailyTaskDone(JOURNAL_TASK, input)).toBe(true);
  });
});

describe("core/engine/dayAchieved — isDayAchieved theo thứ (§4.5)", () => {
  function makeInput(dayKey: DayKey, doneTaskIds: Set<string>) {
    return {
      dayKey,
      dailyTasks: SIX_TASKS,
      journalHabitId: 12,
      completedSessionCountByLabelId: new Map([
        [1, doneTaskIds.has("english") ? 4 : 0],
        [2, doneTaskIds.has("deepWork") ? 4 : 0],
        [3, doneTaskIds.has("newKnowledge") ? 2 : 0],
      ]),
      habitScoreByHabitId: new Map([
        [10, doneTaskIds.has("sport") ? 4 : 1],
        [11, doneTaskIds.has("sleep") ? 4 : 1],
      ]),
      hasJournalText: doneTaskIds.has("journal"),
    };
  }

  it("Thứ Tư (giữa tuần) cần 4/6 — đúng 4 việc thì đạt", () => {
    const input = makeInput(WEDNESDAY, new Set(["newKnowledge", "sport", "sleep", "journal"]));
    expect(isDayAchieved(input)).toBe(true);
  });

  it("Thứ Tư chỉ 3/6 → chưa đạt", () => {
    const input = makeInput(WEDNESDAY, new Set(["sport", "sleep", "journal"]));
    expect(isDayAchieved(input)).toBe(false);
  });

  it("Thứ Hai cũng cần 4/6, giống thứ trong tuần", () => {
    const input = makeInput(MONDAY, new Set(["newKnowledge", "sport", "sleep", "journal"]));
    expect(isDayAchieved(input)).toBe(true);
  });

  it("Thứ Bảy chỉ cần 3/6", () => {
    const input = makeInput(SATURDAY, new Set(["sport", "sleep", "journal"]));
    expect(isDayAchieved(input)).toBe(true);
  });

  it("Thứ Bảy 2/6 → chưa đạt", () => {
    const input = makeInput(SATURDAY, new Set(["sport", "journal"]));
    expect(isDayAchieved(input)).toBe(false);
  });

  it("Chủ nhật chỉ cần viết nhật ký — dù 5 việc khác đều đạt cũng không quan trọng", () => {
    const notJournal = makeInput(
      SUNDAY,
      new Set(["english", "deepWork", "newKnowledge", "sport", "sleep"]),
    );
    expect(isDayAchieved(notJournal)).toBe(false);

    const onlyJournal = makeInput(SUNDAY, new Set(["journal"]));
    expect(isDayAchieved(onlyJournal)).toBe(true);
  });
});
