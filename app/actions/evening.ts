"use server";

import { now } from "@/core/clock";
import { isDailyTaskDone, type DayAchievedInput } from "@/core/engine/dayAchieved";
import { promptIndexForDay } from "@/core/journalPrompt";
import { daySummaryLine } from "@/core/summary";
import { HABIT_SCORE_MAX, HABIT_SCORE_MIN, MOOD_MAX, MOOD_MIN } from "@/core/balance";
import type { DayKey } from "@/core/types";
import {
  closeDay,
  countCompletedSessionsByLabelForDay,
  getDayLog,
  listActiveHabits,
  listActivePrompts,
  listDailyTasksWithRef,
  listHabitEntriesForDay,
  listSessionsForDay,
  upsertHabitScore,
  upsertJournal,
  upsertMood,
} from "@/db/queries";

/**
 * Một dòng trong khối "Check-in" — [MỚI, 2026-09-16]. Trước đây khối này (tên cũ "Habits") chỉ
 * có Sport/Sleep; chủ dự án báo không thấy đâu để biết đã làm bao nhiêu phiên English/Deep work
 * — gộp cả nhãn có ngưỡng phiên (§4.5 "6 việc") vào chung, theo đúng thứ tự đã cấu hình ở Cài
 * đặt (`daily_tasks.sort_order`), thay vì hard-code tên ba nhãn này (§12.4).
 *
 * Ba dạng, ứng với ba cách "đạt" ở `core/engine/dayAchieved.ts`:
 * - "label": nhãn có ngưỡng SỐ PHIÊN (English, Deep work, New knowledge...) — có nút "+" ghi bù
 *   nhanh đúng 1 phiên, chỉ khi đang xem "Hôm nay" (ghi bù phiên chỉ tính hôm nay, §4.3).
 * - "habit_score": thói quen chấm 1-5 (Sport, Sleep enough) — y hệt trước, chỉ thêm `done`.
 *   `threshold` có thể `null` cho một thói quen KHÔNG nằm trong "6 việc" đã cấu hình (tồn tại
 *   nhưng chưa thêm ở Cài đặt) — vẫn chấm được như trước khi có khối check-in này, chỉ là
 *   không có ngưỡng nào để so (không góp XP/ngày đạt — `core/engine/xp.ts` chỉ duyệt qua
 *   `dailyTasks`, xem SPEC.md §4.4/§4.5).
 * - "journal_status": chỉ hiện trạng thái đã viết/chưa — viết thật ở khối Journal bên dưới.
 */
export type CheckInItem =
  | { kind: "label"; labelId: number; name: string; emoji: string; count: number; threshold: number; done: boolean }
  | { kind: "habit_score"; habitId: number; name: string; emoji: string; score: number | null; threshold: number | null; done: boolean }
  | { kind: "journal_status"; name: string; emoji: string; done: boolean };

export type EveningData = {
  dayKey: DayKey;
  summaryLine: string;
  checkIn: CheckInItem[];
  mood: number | null;
  journalText: string;
  journalPrompt: { id: number; text: string } | null;
  closedAt: number | null;
};

/** Mọi thứ để vẽ nghi thức tối cho một ngày cụ thể (hôm nay hoặc hôm qua — §4.11). */
export async function getEveningDataAction(dayKey: DayKey): Promise<EveningData> {
  const [tasks, allHabits, entries, dayLog, prompts, sessions, sessionCountByLabel] = await Promise.all([
    listDailyTasksWithRef(),
    listActiveHabits(),
    listHabitEntriesForDay(dayKey),
    getDayLog(dayKey),
    listActivePrompts(),
    listSessionsForDay(dayKey),
    countCompletedSessionsByLabelForDay(dayKey),
  ]);

  const entryByHabit = new Map(entries.map((e) => [e.habitId, e]));
  // "Viết nhật ký" (kind=journal) đọc thẳng day_logs.journal_text — không có dòng habit_entries
  // riêng, đừng nhân đôi dữ liệu (SPEC.md §7).
  const hasJournalText = (dayLog?.journalText?.trim().length ?? 0) > 0;

  // Tái dùng ĐÚNG hàm "ngày đạt" (core/engine/dayAchieved.ts) để tính `done` cho từng dòng — một
  // nơi duy nhất biết ngưỡng nào là "đạt" (§8.1), không lặp lại phép so sánh >= ngưỡng ở đây.
  const dayAchievedInput: DayAchievedInput = {
    dayKey,
    dailyTasks: tasks.map((t) => ({ refType: t.refType, refId: t.refId, threshold: t.threshold })),
    completedSessionCountByLabelId: sessionCountByLabel,
    habitScoreByHabitId: new Map(entries.flatMap((e) => (e.score !== null ? [[e.habitId, e.score] as const] : []))),
    journalHabitId: tasks.find((t) => t.habitKind === "journal")?.refId ?? null,
    hasJournalText,
  };

  const configured: CheckInItem[] = tasks.map((t) => {
    const done = isDailyTaskDone({ refType: t.refType, refId: t.refId, threshold: t.threshold }, dayAchievedInput);
    if (t.refType === "label") {
      return {
        kind: "label",
        labelId: t.refId,
        name: t.name,
        emoji: t.emoji,
        count: sessionCountByLabel.get(t.refId) ?? 0,
        threshold: t.threshold ?? 1, // nhãn trong "6 việc" luôn có ngưỡng thật (DailyTasksSection bắt buộc) — phòng thân dữ liệu bất thường
        done,
      };
    }
    if (t.habitKind === "journal") {
      return { kind: "journal_status", name: t.name, emoji: t.emoji, done };
    }
    return {
      kind: "habit_score",
      habitId: t.refId,
      name: t.name,
      emoji: t.emoji,
      score: entryByHabit.get(t.refId)?.score ?? null,
      threshold: t.threshold ?? HABIT_SCORE_MAX,
      done,
    };
  });

  // Thói quen tồn tại nhưng CHƯA thêm vào "6 việc" ở Cài đặt — trước khi có khối check-in này,
  // khối "Habits" cũ hiện MỌI thói quen đang hoạt động (không lọc theo daily_tasks). Giữ đúng
  // hành vi đó cho các thói quen ngoài danh sách, nối vào SAU các dòng đã cấu hình — gộp vào
  // khối mới không được làm mất chỗ chấm điểm đã có từ trước.
  const configuredHabitIds = new Set(tasks.filter((t) => t.refType === "habit").map((t) => t.refId));
  const extraHabits: CheckInItem[] = allHabits
    .filter((h) => h.kind !== "journal" && !configuredHabitIds.has(h.id))
    .map((h) => ({
      kind: "habit_score",
      habitId: h.id,
      name: h.name,
      emoji: h.emoji,
      score: entryByHabit.get(h.id)?.score ?? null,
      threshold: null,
      done: false,
    }));

  const completed = sessions.filter((s) => s.status === "completed");
  const promptIdx = prompts.length > 0 ? promptIndexForDay(dayKey, prompts.length) : -1;

  return {
    dayKey,
    summaryLine: daySummaryLine(completed.map((s) => ({ labelName: s.labelName }))),
    checkIn: [...configured, ...extraHabits],
    mood: dayLog?.mood ?? null,
    journalText: dayLog?.journalText ?? "",
    journalPrompt: promptIdx >= 0 ? { id: prompts[promptIdx].id, text: prompts[promptIdx].text } : null,
    closedAt: dayLog?.closedAt ? dayLog.closedAt.getTime() : null,
  };
}

export async function saveHabitScoreAction(habitId: number, dayKey: DayKey, score: number) {
  if (score < HABIT_SCORE_MIN || score > HABIT_SCORE_MAX) {
    throw new Error(`Score must be between ${HABIT_SCORE_MIN} and ${HABIT_SCORE_MAX}.`);
  }
  await upsertHabitScore(habitId, dayKey, score);
}

export async function saveMoodAction(dayKey: DayKey, mood: number) {
  if (mood < MOOD_MIN || mood > MOOD_MAX) {
    throw new Error(`Mood must be between ${MOOD_MIN} and ${MOOD_MAX}.`);
  }
  await upsertMood(dayKey, mood);
}

export async function saveJournalAction(dayKey: DayKey, text: string, promptId: number | null) {
  await upsertJournal(dayKey, text, promptId);
}

/** Không khoá ngày lại — vẫn sửa được sau (§11.2 câu Q16). Đóng muộn vẫn tính đủ (§4.11). */
export async function closeDayAction(dayKey: DayKey) {
  await closeDay(dayKey);
  return now();
}
