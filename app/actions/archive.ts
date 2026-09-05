"use server";

/** Kho lưu trữ — SPEC.md §5.5, mốc 7. Đọc lại nhật ký, lọc theo ngày, "hôm nay năm ngoái". */

import { now } from "@/core/clock";
import { addDays, dayKeyOf, oneYearAgo } from "@/core/day";
import type { DayKey } from "@/core/types";
import { getDayLog, listDayLogsInRange } from "@/db/queries";

/** Không lọc gì thì mặc định 60 ngày gần nhất — tránh kéo về cả lịch sử nhiều năm mỗi lần mở. */
const DEFAULT_RANGE_DAYS = 60;

export type ArchiveEntry = { dayKey: DayKey; mood: number | null; text: string };

export type ArchiveData = {
  entries: readonly ArchiveEntry[];
  oneYearAgoDayKey: DayKey;
  oneYearAgoEntry: ArchiveEntry | null;
  fromDayKey: DayKey;
  toDayKey: DayKey;
};

export async function getArchiveDataAction(fromDayKey?: DayKey, toDayKey?: DayKey): Promise<ArchiveData> {
  const todayKey = dayKeyOf(now());
  const to = toDayKey ?? todayKey;
  const from = fromDayKey ?? addDays(to, -DEFAULT_RANGE_DAYS);
  const yearAgoKey = oneYearAgo(todayKey);

  const [rows, yearAgoRow] = await Promise.all([listDayLogsInRange(from, to), getDayLog(yearAgoKey)]);

  const entries: ArchiveEntry[] = rows
    .filter((r) => (r.journalText?.trim().length ?? 0) > 0)
    .map((r) => ({ dayKey: r.dayKey as DayKey, mood: r.mood, text: r.journalText!.trim() }));

  const oneYearAgoEntry: ArchiveEntry | null =
    yearAgoRow && (yearAgoRow.journalText?.trim().length ?? 0) > 0
      ? { dayKey: yearAgoKey, mood: yearAgoRow.mood, text: yearAgoRow.journalText!.trim() }
      : null;

  return { entries, oneYearAgoDayKey: yearAgoKey, oneYearAgoEntry, fromDayKey: from, toDayKey: to };
}
