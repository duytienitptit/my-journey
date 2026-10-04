"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { addDays } from "@/core/day";
import type { DayKey } from "@/core/types";
import {
  closeDayAction, getEveningDataAction, saveHabitScoreAction, saveJournalAction,
  saveMoodAction, type EveningData,
} from "@/app/actions/evening";

export type SelectedDay = "today" | "yesterday";
type Props = {
  todayKey: DayKey;
  todayData: EveningData;
  onTodayDataChange: Dispatch<SetStateAction<EveningData>>;
  onXpMightHaveChanged?: () => void;
  onBackfillOneSession: (labelId: number) => Promise<boolean>;
  onUndoBackfillSession: (labelId: number) => Promise<boolean>;
};

/** Today's dashboard and check-in share one snapshot; the editor owns its unsaved draft. */
export function useEveningRitual({ todayKey, todayData, onTodayDataChange, onXpMightHaveChanged, onBackfillOneSession, onUndoBackfillSession }: Props) {
  const yesterdayKey = addDays(todayKey, -1);
  const [selectedDay, setSelectedDay] = useState<SelectedDay>("today");
  const [yesterday, setYesterday] = useState<EveningData | null>(null);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const dayKey = selectedDay === "today" ? todayKey : yesterdayKey;
  const data = selectedDay === "today" ? todayData : yesterday;

  useEffect(() => {
    if (selectedDay !== "yesterday" || yesterday) return;
    let cancelled = false;
    void getEveningDataAction(yesterdayKey).then((fresh) => {
      if (!cancelled) setYesterday(fresh);
    }).catch(() => { if (!cancelled) setError("Could not load yesterday. Select Today, then try again."); });
    return () => { cancelled = true; };
  }, [selectedDay, yesterday, yesterdayKey]);

  async function refreshDay(key: DayKey) {
    const fresh = await getEveningDataAction(key);
    if (key === todayKey) onTodayDataChange(fresh);
    else setYesterday(fresh);
  }

  async function commit(action: () => Promise<unknown>, key: DayKey, xp: boolean, throwOnError = false) {
    setPending((n) => n + 1);
    setError(null);
    try {
      await action();
      await refreshDay(key);
      if (xp) onXpMightHaveChanged?.();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
      if (throwOnError) throw err;
      return false;
    } finally { setPending((n) => n - 1); }
  }

  async function saveHabitScore(habitId: number, score: number) {
    await commit(() => saveHabitScoreAction(habitId, dayKey, score), dayKey, true);
  }
  async function saveMood(mood: number) {
    await commit(() => saveMoodAction(dayKey, mood), dayKey, false);
  }
  async function saveJournal(text: string) {
    setError(null);
    try {
      // Editing an existing entry changes neither XP nor the weekly metrics. Keep the
      // confirmed text local instead of refetching the whole day and all computed stats.
      const savedText = await saveJournalAction(dayKey, text, data?.journalPrompt?.id ?? null);
      const hadJournal = Boolean(data?.journalText.trim());
      const hasJournal = Boolean(savedText.trim());
      const applySavedText = (previous: EveningData): EveningData => ({
        ...previous,
        journalText: savedText,
        checkIn: previous.checkIn.map((item) => item.kind === "journal_status" ? { ...item, done: hasJournal } : item),
      });
      if (dayKey === todayKey) onTodayDataChange(applySavedText);
      else setYesterday((previous) => previous ? applySavedText(previous) : previous);
      if (hadJournal !== hasJournal) onXpMightHaveChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
      throw err;
    }
  }
  async function quickAddSession(labelId: number) {
    if (selectedDay !== "today") return;
    await commit(async () => {
      if (!await onBackfillOneSession(labelId)) throw new Error("Could not confirm the save. Refresh status and check today’s count before adding again.");
    }, todayKey, false);
  }
  async function undoOneSession(labelId: number) {
    if (selectedDay !== "today") return;
    await commit(async () => {
      if (!await onUndoBackfillSession(labelId)) throw new Error("Could not confirm removal. Refresh status and check today’s count before removing again.");
    }, todayKey, false);
  }
  async function close() {
    return commit(() => closeDayAction(dayKey), dayKey, true);
  }
  return { selectedDay, setSelectedDay, dayKey, data, pending: pending > 0, error, saveHabitScore, saveMood, saveJournal, quickAddSession, undoOneSession, close };
}
