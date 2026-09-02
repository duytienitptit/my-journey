/**
 * Nguồn điểm mỗi ngày — SPEC.md §4.4. Hàm thuần: bản ghi thô của MỘT ngày → XP kiếm được ngày
 * đó, theo từng chỉ số. Không cộng dồn, không đọc trạng thái ngày khác — `timeline.ts` lo phần
 * cộng dồn qua nhiều ngày và trừ decay.
 */

import { REST_WELL_THRESHOLD_AVG, XP_CLOSE_DAY, XP_DAY_ACHIEVED, XP_HABIT_KEPT, XP_REST_WELL, XP_SESSION_COMPLETE, XP_WEEK_REVIEW } from "../balance";
import { STAT_KEYS } from "../types";
import type { StatKey } from "../types";
import type { DailyTaskConfig, HabitKind, RawCompletedSession } from "./types";

export type XpEarnedInput = {
  /** Phiên hoàn thành CỦA ĐÚNG NGÀY NÀY — ghi bù (source=manual) tính y hệt phiên thật (§4.4). */
  completedSessionsToday: readonly RawCompletedSession[];
  labelStatById: ReadonlyMap<number, StatKey>;
  dailyTasks: readonly DailyTaskConfig[];
  habitStatById: ReadonlyMap<number, StatKey>;
  habitKindById: ReadonlyMap<number, HabitKind>;
  /** Điểm chấm hôm đó theo habitId — chỉ kind=score_1_5. Chưa chấm thì không có trong map (§11.3 Q24: tính 0). */
  habitScoreByHabitId: ReadonlyMap<number, number>;
  hasJournalText: boolean;
  closedToday: boolean;
  restWellToday: boolean;
  weekReviewWrittenToday: boolean;
  dayAchievedToday: boolean;
};

function zeroByStat(): Record<StatKey, number> {
  return { mind: 0, health: 0, spirit: 0 };
}

/** Một thói quen (score_1_5 hoặc journal) có "giữ được" hôm đó không — dùng CHUNG ngưỡng với §4.5. */
function isHabitKeptToday(
  task: DailyTaskConfig,
  kind: HabitKind | undefined,
  input: XpEarnedInput,
): boolean {
  if (kind === "journal") return input.hasJournalText;
  if (task.threshold === null) return false; // dữ liệu bất thường — không có ngưỡng thì không thể "giữ được"
  const score = input.habitScoreByHabitId.get(task.refId) ?? 0;
  return score >= task.threshold;
}

/** XP kiếm được trong một ngày, theo từng chỉ số — SPEC.md §4.4, chưa trừ decay. */
export function xpEarnedForDay(input: XpEarnedInput): Record<StatKey, number> {
  const earned = zeroByStat();

  // 1) Phiên hoàn thành (kể cả ghi bù — cùng mức XP, §4.4).
  for (const session of input.completedSessionsToday) {
    const stat = input.labelStatById.get(session.labelId);
    if (stat) earned[stat] += XP_SESSION_COMPLETE;
  }

  // 2) Thói quen giữ được — CHỈ áp cho habit trong 6 việc (§4.5 câu Q10: nhãn không có khoản này).
  for (const task of input.dailyTasks) {
    if (task.refType !== "habit") continue;
    const stat = input.habitStatById.get(task.refId);
    if (!stat) continue;
    const kind = input.habitKindById.get(task.refId);
    if (isHabitKeptToday(task, kind, input)) earned[stat] += XP_HABIT_KEPT;
  }

  // 3) Đóng ngày → Spirit.
  if (input.closedToday) earned.spirit += XP_CLOSE_DAY;

  // 4) Nghỉ ngơi đúng cách → Health.
  if (input.restWellToday) earned.health += XP_REST_WELL;

  // 5) Đúc kết tuần, viết hôm nay → Spirit.
  if (input.weekReviewWrittenToday) earned.spirit += XP_WEEK_REVIEW;

  // 6) Thưởng ngày đạt — chia đều 3 chỉ số, luật Z (§11.4 câu T1). Cộng LIÊN THÔNG (live), khác
  //    chuỗi hiển thị (§4.6) vốn chờ tới sáng mai — hai khái niệm khác nhau, xem core/engine/types.ts.
  if (input.dayAchievedToday) {
    const share = XP_DAY_ACHIEVED / STAT_KEYS.length;
    for (const stat of STAT_KEYS) earned[stat] += share;
  }

  return earned;
}

/** "Nghỉ ngơi đúng cách" — SPEC.md §4.7. Chưa chấm = 0 (§11.3 câu Q24, áp dụng cả ở đây). */
export function isRestWell(sportScore: number | null, sleepScore: number | null): boolean {
  const avg = ((sportScore ?? 0) + (sleepScore ?? 0)) / 2;
  return avg >= REST_WELL_THRESHOLD_AVG;
}
