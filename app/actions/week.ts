"use server";

/**
 * "Nhìn lại tuần" — SPEC.md §5.2, mốc 6. LUÔN tuần chứa hôm nay (Thứ Hai → Chủ nhật) — không có
 * màn duyệt tuần cũ, đó là việc của "Thư viện hành trình"/"Kho lưu trữ" (§5.4, §5.5, mốc 7).
 * Tính lại toàn bộ từ bản ghi thô mỗi lần đọc (§8.1) — không cache gì ở đây.
 */

import { CORRELATION_WINDOW_DAYS } from "@/core/balance";
import { now } from "@/core/clock";
import { addDays, dayKeyOf, enumerateDayKeys, mondayOf, weekOf } from "@/core/day";
import { buildDayMetrics, weeklyCorrelationInsight } from "@/core/engine/correlations";
import {
  habitKeepRatesForWeek,
  journalExcerptsForWeek,
  moodCurveForWeek,
  weeklySessionStats,
} from "@/core/engine/weeklyStats";
import type { DayKey, StatKey } from "@/core/types";
import { getEngineRawData, getHideMoney, getLatestNetWorth, getWeekReview, listActiveHabits, upsertWeekReview } from "@/db/queries";

/** Cắt ngắn phần hiển thị — dữ liệu thô (`journalExcerptsForWeek`) giữ toàn văn, cắt là việc của tầng này. */
const JOURNAL_EXCERPT_MAX_CHARS = 220;

export type HabitKeepRateView = {
  habitId: number;
  name: string;
  emoji: string;
  keptDays: number;
  consideredDays: number;
  rate: number;
};

export type WeeklyReviewData = {
  weekStart: DayKey;
  weekDays: readonly DayKey[];
  todayKey: DayKey;
  sessionCountByStat: Record<StatKey, number>;
  totalSessions: number;
  backfillRate: number;
  habitKeepRates: HabitKeepRateView[];
  moodCurve: { dayKey: DayKey; mood: number | null }[];
  journalExcerpts: { dayKey: DayKey; excerpt: string }[];
  /** Đúng MỘT câu hoặc null — SPEC.md §5.2, xem core/engine/correlations.ts. */
  correlationSentence: string | null;
  /** Đã lưu (nếu có) — rỗng nếu tuần này chưa viết đúc kết. */
  reviewText: string;
  netWorth: { stocksVnd: number; goldVnd: number; totalVnd: number } | null;
  hideMoney: boolean;
};

export async function getWeeklyReviewDataAction(): Promise<WeeklyReviewData> {
  const nowMs = now();
  const todayKey = dayKeyOf(nowMs);
  const weekStart = mondayOf(todayKey);
  const weekDays = weekOf(todayKey);
  // Khung lăn cho tương quan — RỘNG HƠN một tuần (§5.2, [CHỐT — 2026-09-05]: 8 tuần gần nhất,
  // không phải toàn bộ lịch sử) — xem ghi chú trong balance.ts.
  const correlationDays = enumerateDayKeys(addDays(todayKey, -(CORRELATION_WINDOW_DAYS - 1)), todayKey);

  const [raw, habitRows, weekReview, netWorth, hideMoney] = await Promise.all([
    getEngineRawData(),
    listActiveHabits(),
    getWeekReview(weekStart),
    getLatestNetWorth(),
    getHideMoney(),
  ]);

  const sessionStats = weeklySessionStats(weekDays, raw.completedSessions, raw.labels);
  const keepRates = habitKeepRatesForWeek(
    weekDays,
    todayKey,
    raw.dailyTasks,
    raw.habits,
    raw.habitEntries,
    raw.dayLogs,
  );
  const habitViewById = new Map(habitRows.map((h) => [h.id, { name: h.name, emoji: h.emoji }]));

  const dayMetrics = buildDayMetrics(correlationDays, raw.habits, raw.habitEntries, raw.dayLogs, raw.completedSessions);
  const insight = weeklyCorrelationInsight(dayMetrics);

  return {
    weekStart,
    weekDays,
    todayKey,
    sessionCountByStat: sessionStats.countByStat,
    totalSessions: sessionStats.totalSessions,
    backfillRate: sessionStats.backfillRate,
    habitKeepRates: keepRates.map((r) => ({
      habitId: r.habitId,
      name: habitViewById.get(r.habitId)?.name ?? "?",
      emoji: habitViewById.get(r.habitId)?.emoji ?? "",
      keptDays: r.keptDays,
      consideredDays: r.consideredDays,
      rate: r.rate,
    })),
    moodCurve: moodCurveForWeek(weekDays, raw.dayLogs),
    journalExcerpts: journalExcerptsForWeek(weekDays, raw.dayLogs).map((e) => ({
      dayKey: e.dayKey,
      excerpt: e.text.length > JOURNAL_EXCERPT_MAX_CHARS ? `${e.text.slice(0, JOURNAL_EXCERPT_MAX_CHARS).trimEnd()}…` : e.text,
    })),
    correlationSentence: insight?.sentence ?? null,
    reviewText: weekReview?.text ?? "",
    netWorth: netWorth
      ? { stocksVnd: netWorth.stocksVnd, goldVnd: netWorth.goldVnd, totalVnd: netWorth.totalVnd }
      : null,
    hideMoney,
  };
}

/** Không khoá lại (§11.2 câu Q16) — sửa được nhiều lần trong tuần, luôn ghi cho tuần chứa HÔM NAY. */
export async function saveWeekReviewAction(text: string): Promise<void> {
  const weekStart = mondayOf(dayKeyOf(now()));
  await upsertWeekReview(weekStart, text.trim());
}
