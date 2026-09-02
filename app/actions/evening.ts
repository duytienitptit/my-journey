"use server";

import { now } from "@/core/clock";
import { promptIndexForDay } from "@/core/journalPrompt";
import { daySummaryLine } from "@/core/summary";
import { HABIT_SCORE_MAX, HABIT_SCORE_MIN, MOOD_MAX, MOOD_MIN } from "@/core/balance";
import type { DayKey } from "@/core/types";
import {
  closeDay,
  getDayLog,
  listActiveHabits,
  listActivePrompts,
  listHabitEntriesForDay,
  listSessionsForDay,
  upsertHabitScore,
  upsertJournal,
  upsertMood,
} from "@/db/queries";

export type EveningHabitView = {
  id: number;
  name: string;
  emoji: string;
  kind: "score_1_5" | "boolean" | "journal";
  score: number | null;
};

export type EveningData = {
  dayKey: DayKey;
  summaryLine: string;
  habits: EveningHabitView[];
  mood: number | null;
  journalText: string;
  journalPrompt: { id: number; text: string } | null;
  closedAt: number | null;
};

/** Mọi thứ để vẽ nghi thức tối cho một ngày cụ thể (hôm nay hoặc hôm qua — §4.11). */
export async function getEveningDataAction(dayKey: DayKey): Promise<EveningData> {
  const [habits, entries, dayLog, prompts, sessions] = await Promise.all([
    listActiveHabits(),
    listHabitEntriesForDay(dayKey),
    getDayLog(dayKey),
    listActivePrompts(),
    listSessionsForDay(dayKey),
  ]);

  const entryByHabit = new Map(entries.map((e) => [e.habitId, e]));
  // "Viết nhật ký" (kind=journal) đọc thẳng day_logs.journal_text — không có dòng habit_entries
  // riêng, đừng nhân đôi dữ liệu (SPEC.md §7).
  const habitsView: EveningHabitView[] = habits
    .filter((h) => h.kind !== "journal")
    .map((h) => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      kind: h.kind,
      score: entryByHabit.get(h.id)?.score ?? null,
    }));

  const completed = sessions.filter((s) => s.status === "completed");
  const promptIdx = prompts.length > 0 ? promptIndexForDay(dayKey, prompts.length) : -1;

  return {
    dayKey,
    summaryLine: daySummaryLine(completed.map((s) => ({ labelName: s.labelName }))),
    habits: habitsView,
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
