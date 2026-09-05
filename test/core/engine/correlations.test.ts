import { describe, expect, it } from "vitest";
import {
  buildDayMetrics,
  pearsonCorrelation,
  weeklyCorrelationInsight,
  type DayMetrics,
} from "../../../core/engine/correlations";
import { CORRELATION_MIN_SAMPLE_DAYS } from "../../../core/balance";
import { addDays } from "../../../core/day";
import type { HabitConfig, RawCompletedSession, RawDayLog, RawHabitEntry } from "../../../core/engine/types";
import type { DayKey } from "../../../core/types";

const START: DayKey = "2026-08-03";

const HABITS: HabitConfig[] = [
  { id: 10, slug: "sport", stat: "health", kind: "score_1_5" },
  { id: 11, slug: "sleep-enough", stat: "health", kind: "score_1_5" },
  { id: 12, slug: "journal", stat: "spirit", kind: "journal" },
];

function days(n: number): DayKey[] {
  return Array.from({ length: n }, (_, i) => addDays(START, i));
}

describe("core/engine/correlations — pearsonCorrelation", () => {
  it("tương quan dương hoàn hảo → r = 1", () => {
    const points = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 4 },
    ];
    expect(pearsonCorrelation(points)).toBeCloseTo(1, 10);
  });

  it("tương quan âm hoàn hảo → r = -1", () => {
    const points = [
      { x: 1, y: 4 },
      { x: 2, y: 3 },
      { x: 3, y: 2 },
      { x: 4, y: 1 },
    ];
    expect(pearsonCorrelation(points)).toBeCloseTo(-1, 10);
  });

  it("một vế không biến thiên (mọi x giống nhau) → 0, không chia cho 0", () => {
    const points = [
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 5, y: 3 },
    ];
    expect(pearsonCorrelation(points)).toBe(0);
  });

  it("mảng rỗng → 0, không NaN, không crash", () => {
    expect(pearsonCorrelation([])).toBe(0);
  });

  it("y đối xứng hình chữ V quanh tâm x — hiệp phương sai đúng 0, không phải gần 0", () => {
    const points = [
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 2 },
    ];
    expect(pearsonCorrelation(points)).toBe(0);
  });
});

describe("core/engine/correlations — buildDayMetrics", () => {
  it("tìm đúng habit Sport/Sleep qua SLUG, không viết cứng tên hiển thị", () => {
    const d = days(1);
    const habitEntries: RawHabitEntry[] = [
      { dayKey: START, habitId: 10, score: 5, done: null },
      { dayKey: START, habitId: 11, score: 3, done: null },
    ];
    const metrics = buildDayMetrics(d, HABITS, habitEntries, [], []);
    expect(metrics[0].sportScore).toBe(5);
    expect(metrics[0].sleepScore).toBe(3);
  });

  it("chưa chấm hôm đó → null (KHÔNG phải 0) — pairwise deletion đọc field này", () => {
    const metrics = buildDayMetrics(days(1), HABITS, [], [], []);
    expect(metrics[0].sportScore).toBeNull();
    expect(metrics[0].sleepScore).toBeNull();
    expect(metrics[0].mood).toBeNull();
  });

  it("nhật ký và số phiên LUÔN có giá trị thật, không bao giờ null", () => {
    const metrics = buildDayMetrics(days(1), HABITS, [], [], []);
    expect(metrics[0].wroteJournal).toBe(0);
    expect(metrics[0].sessionCount).toBe(0);
  });

  it("có viết nhật ký → wroteJournal=1; có phiên hoàn thành → đếm đúng số phiên trong ngày đó", () => {
    const dayLogs: RawDayLog[] = [{ dayKey: START, hasJournalText: true, closedAtMs: null, mood: 4, journalText: "hi" }];
    const sessions: RawCompletedSession[] = [
      { dayKey: START, labelId: 1, source: "timer" },
      { dayKey: START, labelId: 2, source: "manual" },
    ];
    const metrics = buildDayMetrics(days(1), HABITS, [], dayLogs, sessions);
    expect(metrics[0].wroteJournal).toBe(1);
    expect(metrics[0].mood).toBe(4);
    expect(metrics[0].sessionCount).toBe(2);
  });
});

describe("core/engine/correlations — weeklyCorrelationInsight", () => {
  function metricsWithSportMood(
    n: number,
    sportValues: readonly (number | null)[],
    moodValues: readonly (number | null)[],
  ): DayMetrics[] {
    return Array.from({ length: n }, (_, i) => ({
      dayKey: addDays(START, i),
      sportScore: sportValues[i] ?? null,
      sleepScore: null,
      mood: moodValues[i] ?? null,
      wroteJournal: 0,
      sessionCount: 0,
    }));
  }

  it("chưa đủ CORRELATION_MIN_SAMPLE_DAYS ngày dữ liệu cả hai vế → im lặng (null)", () => {
    const n = CORRELATION_MIN_SAMPLE_DAYS - 1;
    const sport = Array.from({ length: n }, (_, i) => 1 + (i % 5));
    const mood = Array.from({ length: n }, (_, i) => 1 + (i % 5));
    expect(weeklyCorrelationInsight(metricsWithSportMood(n, sport, mood))).toBeNull();
  });

  it("đủ mẫu và tương quan mạnh (dương) → trả về câu chữ POSITIVE đúng cặp sportMood", () => {
    const n = CORRELATION_MIN_SAMPLE_DAYS + 2;
    const sport = Array.from({ length: n }, (_, i) => 1 + (i % 5));
    const mood = Array.from({ length: n }, (_, i) => 1 + (i % 5)); // trùng hệt sport → r=1
    const result = weeklyCorrelationInsight(metricsWithSportMood(n, sport, mood));
    expect(result).not.toBeNull();
    expect(result?.pair).toBe("sportMood");
    expect(result?.r).toBeGreaterThan(0.9);
    expect(result?.sentence).toBe("On days you exercise, your mood tends to be noticeably better.");
  });

  it("đủ mẫu và tương quan mạnh (âm) → câu chữ NEGATIVE", () => {
    const n = CORRELATION_MIN_SAMPLE_DAYS + 2;
    const sport = Array.from({ length: n }, (_, i) => 1 + (i % 5));
    const mood = Array.from({ length: n }, (_, i) => 5 - (i % 5)); // ngược hẳn → r=-1
    const result = weeklyCorrelationInsight(metricsWithSportMood(n, sport, mood));
    expect(result?.r).toBeLessThan(-0.9);
    expect(result?.sentence).toBe("On days you exercise, your mood tends to be noticeably lower.");
  });

  it("đủ mẫu nhưng tương quan quá YẾU (dưới CORRELATION_MIN_STRENGTH) → vẫn im lặng, không ép nói", () => {
    const n = CORRELATION_MIN_SAMPLE_DAYS + 5;
    const sport = Array.from({ length: n }, (_, i) => 1 + (i % 5));
    // mood gần như ngẫu nhiên/không liên quan tới sport (đối xứng quanh hằng số, xem test pearson ở trên)
    const mood = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 3 : 1));
    const result = weeklyCorrelationInsight(metricsWithSportMood(n, sport, mood));
    expect(result).toBeNull();
  });

  it("nhiều cặp cùng đủ điều kiện → chọn ĐÚNG MỘT, cặp |r| mạnh nhất", () => {
    const n = CORRELATION_MIN_SAMPLE_DAYS + 2;
    const metrics: DayMetrics[] = Array.from({ length: n }, (_, i) => ({
      dayKey: addDays(START, i),
      sportScore: 1 + (i % 5), // tương quan hoàn hảo với mood (r=1)
      sleepScore: 1 + (i % 3), // tương quan yếu hơn với sessionCount
      mood: 1 + (i % 5),
      wroteJournal: (i % 2) as 0 | 1,
      sessionCount: i % 4,
    }));
    const result = weeklyCorrelationInsight(metrics);
    expect(result).not.toBeNull();
    // sportMood là tương quan HOÀN HẢO (r=1) — chắc chắn mạnh hơn mọi cặp khác trong bộ dữ liệu này.
    expect(result?.pair).toBe("sportMood");
  });

  it("ngày chưa chấm (null) bị LOẠI khỏi mẫu — không tính là 0, không làm sai lệch kết quả", () => {
    const n = CORRELATION_MIN_SAMPLE_DAYS + 5; // 3 ngày null + vẫn còn dư ≥ CORRELATION_MIN_SAMPLE_DAYS điểm hợp lệ
    const sport = Array.from({ length: n }, (_, i) => (i < 3 ? null : 1 + (i % 5)));
    const mood = Array.from({ length: n }, (_, i) => 1 + (i % 5));
    const metrics = metricsWithSportMood(n, sport, mood);
    // 3 ngày đầu sportScore=null → chỉ còn n-3 điểm dữ liệu hợp lệ, vẫn ≥ CORRELATION_MIN_SAMPLE_DAYS.
    const result = weeklyCorrelationInsight(metrics);
    expect(result?.sampleSize).toBe(n - 3);
  });
});
