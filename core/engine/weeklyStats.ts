/**
 * Số liệu tuần cho "Nhìn lại tuần" — SPEC.md §5.2, mốc 6. Bốn hàm thuần, mỗi hàm một mảnh của
 * màn hình: ba thanh chỉ số, tỉ lệ giữ thói quen, đường cong tâm trạng, % ghi bù. Tách khỏi
 * `correlations.ts` (dùng khung thời gian dài hơn, 8 tuần thay vì đúng 1 tuần) dù cùng đọc một
 * bản ghi thô — hai việc khác nhau, không nên chung một hàm.
 */

import { isDailyTaskDone, type DayAchievedInput } from "./dayAchieved";
import type { DailyTaskConfig, HabitConfig, LabelConfig, RawCompletedSession, RawDayLog, RawHabitEntry } from "./types";
import type { DayKey, StatKey } from "../types";

// ─── Ba thanh chỉ số + % ghi bù ────────────────────────────────────────────

export type WeeklySessionStats = {
  countByStat: Record<StatKey, number>;
  totalSessions: number;
  backfilledSessions: number;
  /** 0 nếu totalSessions=0 — tuần chưa có phiên nào thì "% ghi bù" im lặng ở tầng hiển thị. */
  backfillRate: number;
};

export function weeklySessionStats(
  weekDays: readonly DayKey[],
  sessions: readonly RawCompletedSession[],
  labels: readonly LabelConfig[],
): WeeklySessionStats {
  const statByLabelId = new Map(labels.map((l) => [l.id, l.stat]));
  const daySet = new Set(weekDays);
  const countByStat = { mind: 0, health: 0, spirit: 0 } as Record<StatKey, number>;
  let totalSessions = 0;
  let backfilledSessions = 0;

  for (const s of sessions) {
    if (!daySet.has(s.dayKey)) continue;
    totalSessions += 1;
    if (s.source === "manual") backfilledSessions += 1;
    const stat = statByLabelId.get(s.labelId);
    if (stat) countByStat[stat] += 1;
  }

  return {
    countByStat,
    totalSessions,
    backfilledSessions,
    backfillRate: totalSessions > 0 ? backfilledSessions / totalSessions : 0,
  };
}

// ─── Tỉ lệ giữ thói quen (KHÔNG phải streak, SPEC.md §5.2) ────────────────

export type HabitKeepRate = {
  habitId: number;
  /** Số ngày ĐÃ QUA trong tuần mà thói quen này giữ được (đúng ngưỡng daily_tasks, §4.5). */
  keptDays: number;
  /** Số ngày ĐÃ QUA trong tuần tính tới `todayKey` — tuần chưa hết thì mẫu số không phải 7. */
  consideredDays: number;
  /** 0 nếu consideredDays=0 (tuần vừa bắt đầu, hôm nay là Thứ Hai và chưa qua ngày nào). */
  rate: number;
};

/**
 * Tái dùng CHÍNH XÁC ngưỡng "giữ được" đã có ở `dayAchieved.ts` (§4.5: "một ngưỡng duy nhất,
 * dùng cho cả hai việc") — không phải một định nghĩa "giữ được" riêng cho màn tuần.
 */
export function habitKeepRatesForWeek(
  weekDays: readonly DayKey[],
  todayKey: DayKey,
  dailyTasks: readonly DailyTaskConfig[],
  habits: readonly HabitConfig[],
  habitEntries: readonly RawHabitEntry[],
  dayLogs: readonly RawDayLog[],
): HabitKeepRate[] {
  const consideredDays = weekDays.filter((d) => d <= todayKey);
  const journalHabitId = habits.find((h) => h.kind === "journal")?.id ?? null;
  const dayLogByDay = new Map(dayLogs.map((d) => [d.dayKey, d]));
  const entriesByDay = new Map<DayKey, RawHabitEntry[]>();
  for (const e of habitEntries) {
    const bucket = entriesByDay.get(e.dayKey);
    if (bucket) bucket.push(e);
    else entriesByDay.set(e.dayKey, [e]);
  }

  return dailyTasks
    .filter((task) => task.refType === "habit")
    .map((task) => {
      let keptDays = 0;
      for (const day of consideredDays) {
        const entriesToday = entriesByDay.get(day) ?? [];
        const habitScoreByHabitId = new Map(
          entriesToday.filter((e) => e.score !== null).map((e) => [e.habitId, e.score as number]),
        );
        const input: DayAchievedInput = {
          dayKey: day,
          dailyTasks,
          completedSessionCountByLabelId: new Map(), // task này luôn refType="habit", nhánh label không đọc tới
          habitScoreByHabitId,
          journalHabitId,
          hasJournalText: dayLogByDay.get(day)?.hasJournalText ?? false,
        };
        if (isDailyTaskDone(task, input)) keptDays += 1;
      }
      return {
        habitId: task.refId,
        keptDays,
        consideredDays: consideredDays.length,
        rate: consideredDays.length > 0 ? keptDays / consideredDays.length : 0,
      };
    });
}

// ─── Đường cong tâm trạng ───────────────────────────────────────────────────

export type MoodDay = { dayKey: DayKey; mood: number | null };

export function moodCurveForWeek(weekDays: readonly DayKey[], dayLogs: readonly RawDayLog[]): MoodDay[] {
  const moodByDay = new Map(dayLogs.map((d) => [d.dayKey, d.mood]));
  return weekDays.map((dayKey) => ({ dayKey, mood: moodByDay.get(dayKey) ?? null }));
}

// ─── Trích nhật ký trong tuần ───────────────────────────────────────────────

export type JournalExcerpt = { dayKey: DayKey; text: string };

/** Toàn văn (không cắt ngắn — cắt là việc của tầng hiển thị), chỉ những ngày có viết. */
export function journalExcerptsForWeek(
  weekDays: readonly DayKey[],
  dayLogs: readonly RawDayLog[],
): JournalExcerpt[] {
  const byDay = new Map(dayLogs.map((d) => [d.dayKey, d]));
  const result: JournalExcerpt[] = [];
  for (const day of weekDays) {
    const text = byDay.get(day)?.journalText?.trim();
    if (text) result.push({ dayKey: day, text });
  }
  return result;
}
