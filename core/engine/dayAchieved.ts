/**
 * Ngày "đạt" — SPEC.md §4.5. Đọc `daily_tasks` (đã dịch sang `DailyTaskConfig[]` ở tầng gọi),
 * KHÔNG viết cứng tên nhãn/thói quen (§12.4 — đúng lỗi bản trước mắc phải).
 */

import { DAY_ACHIEVED_REQUIRED_COUNT } from "../balance";
import { isoWeekdayOf } from "../day";
import type { DayKey } from "../types";
import type { DailyTaskConfig } from "./types";

export type DayAchievedInput = {
  dayKey: DayKey;
  dailyTasks: readonly DailyTaskConfig[];
  /** Số phiên HOÀN THÀNH hôm đó, theo từng labelId. */
  completedSessionCountByLabelId: ReadonlyMap<number, number>;
  /** Điểm chấm hôm đó, theo từng habitId — chỉ habit kind=score_1_5/boolean (không có journal). */
  habitScoreByHabitId: ReadonlyMap<number, number>;
  /** habitId của thói quen kind=journal, nếu có — để tách nhánh đọc day_logs thay vì habit_entries. */
  journalHabitId: number | null;
  hasJournalText: boolean;
};

/** Một dòng trong 6 việc, hôm đó có đạt ngưỡng của nó không. */
export function isDailyTaskDone(task: DailyTaskConfig, input: DayAchievedInput): boolean {
  const threshold = task.threshold;
  if (threshold === null) {
    // Chỉ habit kind=journal có threshold=null (§4.5: "đạt = có chữ, không có ngưỡng số").
    return input.hasJournalText;
  }
  if (task.refType === "label") {
    const count = input.completedSessionCountByLabelId.get(task.refId) ?? 0;
    return count >= threshold;
  }
  // habit — kể cả khi refId trùng journalHabitId nhưng threshold lại không null (dữ liệu bất
  // thường): vẫn ưu tiên nhánh threshold=null ở trên cho journal, nhánh này chỉ còn score_1_5.
  // Chưa chấm điểm hôm đó = 0 (§11.3 câu Q24) — không phải "bỏ qua", tính thẳng là chưa đạt.
  const score = input.habitScoreByHabitId.get(task.refId) ?? 0;
  return score >= threshold;
}

/**
 * Ngày `dayKey` có "đạt" không. Chủ nhật là trường hợp riêng — chỉ cần có viết nhật ký, KHÔNG
 * xét tới danh sách `dailyTasks` (§4.5: "không quan tâm 5 việc kia"), dù thói quen Journal có
 * còn nằm trong 6 việc hay không.
 */
export function isDayAchieved(input: DayAchievedInput): boolean {
  const required = DAY_ACHIEVED_REQUIRED_COUNT[isoWeekdayOf(input.dayKey)];
  if (required === "journal_only") return input.hasJournalText;
  const doneCount = input.dailyTasks.filter((task) => isDailyTaskDone(task, input)).length;
  return doneCount >= required;
}

/**
 * TOÀN BỘ 6 việc trong ngày, bất kể hôm đó là thứ mấy — ngưỡng CỐ Ý cao hơn hẳn `isDayAchieved`
 * (vốn đã nới theo thứ trong tuần). Chỉ dùng để "cứu" chuỗi ngày-đạt sau đúng 1 ngày ân hạn
 * (SPEC.md §4.6, [CHỐT — 2026-09-04]) — không dùng cho việc gì khác, không thay thế
 * `isDayAchieved`. Không có nhánh Chủ nhật riêng: dù Chủ nhật vốn chỉ cần viết nhật ký để
 * "đạt", muốn CỨU chuỗi thì vẫn phải đủ cả 6, đúng ý chủ dự án đã xác nhận.
 */
export function isDayPerfect(input: DayAchievedInput): boolean {
  return input.dailyTasks.every((task) => isDailyTaskDone(task, input));
}
