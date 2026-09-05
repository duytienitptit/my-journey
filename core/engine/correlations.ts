/**
 * Một tương quan mỗi tuần — SPEC.md §5.2, mốc 6. Đúng 6 cặp cố định, hệ số Pearson trên khung
 * lăn `CORRELATION_WINDOW_DAYS` ngày gần nhất (không phải toàn bộ lịch sử — xem ghi chú trong
 * `balance.ts`). Cần ≥ `CORRELATION_MIN_SAMPLE_DAYS` ngày có đủ dữ liệu CẢ HAI vế mới xét; trong
 * số cặp đủ điều kiện, chọn cặp |r| lớn nhất; nếu vẫn dưới `CORRELATION_MIN_STRENGTH` thì im
 * lặng hoàn toàn — không bịa một câu tương quan gần như vô nghĩa (ba lựa chọn này đã hỏi và chốt
 * ngày 2026-09-05, xem SPEC.md §5.2).
 */

import { CORRELATION_MIN_SAMPLE_DAYS, CORRELATION_MIN_STRENGTH } from "../balance";
import type { DayKey } from "../types";
import type { HabitConfig, RawCompletedSession, RawDayLog, RawHabitEntry } from "./types";

// ─── Bước 1: gộp bản ghi thô thành số liệu MỖI NGÀY ────────────────────────

export type DayMetrics = {
  dayKey: DayKey;
  /** null nếu chưa chấm hôm đó — loại khỏi mẫu (pairwise), KHÔNG tính là 0. */
  sportScore: number | null;
  sleepScore: number | null;
  mood: number | null;
  /** Luôn có giá trị thật (0/1) — "không viết" là một sự thật, không phải "chưa biết". */
  wroteJournal: 0 | 1;
  /** Luôn có giá trị thật — 0 nếu không có phiên nào, không phải "chưa biết". */
  sessionCount: number;
};

/** `habits` chỉ dùng để tìm ID của Sport/Sleep enough qua SLUG (§4.7, cùng cách timeline.ts làm — không viết cứng tên). */
export function buildDayMetrics(
  days: readonly DayKey[],
  habits: readonly HabitConfig[],
  habitEntries: readonly RawHabitEntry[],
  dayLogs: readonly RawDayLog[],
  sessions: readonly RawCompletedSession[],
): DayMetrics[] {
  const sportHabitId = habits.find((h) => h.slug === "sport")?.id ?? null;
  const sleepHabitId = habits.find((h) => h.slug === "sleep-enough")?.id ?? null;

  const entriesByDay = new Map<DayKey, RawHabitEntry[]>();
  for (const e of habitEntries) {
    const bucket = entriesByDay.get(e.dayKey);
    if (bucket) bucket.push(e);
    else entriesByDay.set(e.dayKey, [e]);
  }
  const dayLogByDay = new Map(dayLogs.map((d) => [d.dayKey, d]));
  const sessionCountByDay = new Map<DayKey, number>();
  for (const s of sessions) sessionCountByDay.set(s.dayKey, (sessionCountByDay.get(s.dayKey) ?? 0) + 1);

  const scoreFor = (day: DayKey, habitId: number | null): number | null => {
    if (habitId === null) return null;
    return entriesByDay.get(day)?.find((e) => e.habitId === habitId)?.score ?? null;
  };

  return days.map((dayKey) => ({
    dayKey,
    sportScore: scoreFor(dayKey, sportHabitId),
    sleepScore: scoreFor(dayKey, sleepHabitId),
    mood: dayLogByDay.get(dayKey)?.mood ?? null,
    wroteJournal: dayLogByDay.get(dayKey)?.hasJournalText ? 1 : 0,
    sessionCount: sessionCountByDay.get(dayKey) ?? 0,
  }));
}

// ─── Bước 2: hệ số tương quan Pearson ───────────────────────────────────────

/** Hệ số tương quan Pearson (-1..1). Trả về 0 nếu không đủ điểm hoặc một vế không biến thiên
 *  (chia cho 0) — một chuỗi toàn cùng một giá trị thì "không tương quan" là câu trả lời đúng. */
export function pearsonCorrelation(points: readonly { x: number; y: number }[]): number {
  const n = points.length;
  if (n === 0) return 0;
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }
  if (sumSqX === 0 || sumSqY === 0) return 0;
  return numerator / Math.sqrt(sumSqX * sumSqY);
}

// ─── Bước 3: 6 cặp cố định + câu chữ (SPEC.md §5.2) ────────────────────────

export type CorrelationPairKey =
  | "sportMood"
  | "sleepSessions"
  | "journalMood"
  | "sessionsMood"
  | "sleepMood"
  | "sportSessions";

type PairDefinition = {
  key: CorrelationPairKey;
  extractX: (d: DayMetrics) => number | null;
  extractY: (d: DayMetrics) => number | null;
  /** Câu chữ mốc đầu (2026-09-05) — chưa qua vòng duyệt riêng như câu trách móc §4.12, có thể sửa sau. */
  positiveSentence: string;
  negativeSentence: string;
};

const PAIRS: readonly PairDefinition[] = [
  {
    key: "sportMood",
    extractX: (d) => d.sportScore,
    extractY: (d) => d.mood,
    positiveSentence: "On days you exercise, your mood tends to be noticeably better.",
    negativeSentence: "On days you exercise, your mood tends to be noticeably lower.",
  },
  {
    key: "sleepSessions",
    extractX: (d) => d.sleepScore,
    extractY: (d) => d.sessionCount,
    positiveSentence: "On days you sleep well, you tend to get noticeably more sessions done.",
    negativeSentence: "On days you sleep well, you tend to get noticeably fewer sessions done.",
  },
  {
    key: "journalMood",
    extractX: (d) => d.wroteJournal,
    extractY: (d) => d.mood,
    positiveSentence: "On days you write in your journal, your mood tends to be noticeably better.",
    negativeSentence: "On days you write in your journal, your mood tends to be noticeably lower.",
  },
  {
    key: "sessionsMood",
    extractX: (d) => d.sessionCount,
    extractY: (d) => d.mood,
    positiveSentence: "On days you get more sessions done, your mood tends to be noticeably better.",
    negativeSentence: "On days you get more sessions done, your mood tends to be noticeably lower.",
  },
  {
    key: "sleepMood",
    extractX: (d) => d.sleepScore,
    extractY: (d) => d.mood,
    positiveSentence: "On days you sleep well, your mood tends to be noticeably better.",
    negativeSentence: "On days you sleep well, your mood tends to be noticeably lower.",
  },
  {
    key: "sportSessions",
    extractX: (d) => d.sportScore,
    extractY: (d) => d.sessionCount,
    positiveSentence: "On days you exercise, you tend to get noticeably more sessions done.",
    negativeSentence: "On days you exercise, you tend to get noticeably fewer sessions done.",
  },
];

export type CorrelationInsight = {
  pair: CorrelationPairKey;
  r: number;
  sampleSize: number;
  sentence: string;
};

/**
 * ĐÚNG MỘT câu (hoặc `null`) — cặp |r| mạnh nhất trong số đủ mẫu, miễn là vượt ngưỡng "đáng nói".
 * `days` đã là khung thời gian đúng (caller cắt sẵn `CORRELATION_WINDOW_DAYS` ngày gần nhất).
 */
export function weeklyCorrelationInsight(days: readonly DayMetrics[]): CorrelationInsight | null {
  let best: CorrelationInsight | null = null;
  for (const pair of PAIRS) {
    const points: { x: number; y: number }[] = [];
    for (const d of days) {
      const x = pair.extractX(d);
      const y = pair.extractY(d);
      if (x !== null && y !== null) points.push({ x, y });
    }
    if (points.length < CORRELATION_MIN_SAMPLE_DAYS) continue;
    const r = pearsonCorrelation(points);
    if (best === null || Math.abs(r) > Math.abs(best.r)) {
      best = {
        pair: pair.key,
        r,
        sampleSize: points.length,
        sentence: r >= 0 ? pair.positiveSentence : pair.negativeSentence,
      };
    }
  }
  if (best === null || Math.abs(best.r) < CORRELATION_MIN_STRENGTH) return null;
  return best;
}
