import { BEDTIME_CUTOFF } from "./balance";
import { addDays, dayKeyOf } from "./day";
import type { DayKey } from "./types";

// Preserve the stable slug and historical scores; only the current check-in UI changes.
export const BEDTIME_SLUG = "sleep-enough";
export const BEDTIME_NAME = "Bed before 22:30";

export function bedtimeDeadline(dayKey: DayKey): number {
  return new Date(`${dayKey}T${BEDTIME_CUTOFF}:00+07:00`).getTime();
}

export function canCheckBedtime(dayKey: DayKey, nowMs: number): boolean {
  return dayKey === dayKeyOf(nowMs) && nowMs < bedtimeDeadline(dayKey);
}

export function assertEditableDay(dayKey: DayKey, nowMs: number): void {
  const today = dayKeyOf(nowMs);
  if (dayKey !== today && dayKey !== addDays(today, -1)) throw new Error("Only today and yesterday can be edited.");
}
