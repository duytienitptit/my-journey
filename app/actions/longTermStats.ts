"use server";

/**
 * Thống kê dài hạn — SPEC.md §5.8, màn `/stats`. Tính lại toàn bộ từ bản ghi thô mỗi lần đọc
 * (§8.1) — không cache, không lưu con số nào xuống DB.
 *
 * Tầng này chỉ làm ba việc: đọc DB, gọi hàm thuần trong `core/engine/longTermStats.ts`, rồi
 * GHÉP TÊN hiển thị (tên nhãn, emoji, màu) vào kết quả — đúng ranh giới đã dùng ở màn tuần
 * (`week.ts`): engine trả id và số, tầng này lo chữ.
 */

import { STATS_WINDOW_MONTHS } from "@/core/balance";
import { now } from "@/core/clock";
import { dayKeyOf } from "@/core/day";
import {
  heatmapCells,
  hoursByLabelPerWeek,
  lifetimeTotals,
  monthlyStatTrend,
  personalRecords,
  weekStartsOf,
  windowDaysOf,
  windowMonthsOf,
  type HeatmapCell,
  type MonthKey,
} from "@/core/engine/longTermStats";
import { foldTimeline } from "@/core/engine/timeline";
import type { DayKey, StatKey } from "@/core/types";
import { getEngineRawData, getSettings, listActiveLabels } from "@/db/queries";

export type LabelHoursView = {
  labelId: number;
  name: string;
  emoji: string;
  color: string;
  hours: number;
};

export type LongTermStatsData = {
  todayKey: DayKey;
  /** Khối 1 — toàn thời gian, không giới hạn 12 tháng (§5.8). */
  lifetime: { totalSessions: number; totalHours: number; daysAchieved: number; startedDayKey: DayKey };
  /** Khối 2 — một ô mỗi ngày trong khung 12 tháng. */
  heatmap: readonly HeatmapCell[];
  /** Khối 3 — XP ba chỉ số cuối mỗi tháng. */
  monthlyTrend: readonly { month: MonthKey; xpByStat: Record<StatKey, number> }[];
  /** Khối 5 — toàn thời gian (§5.8). */
  records: {
    mostSessionsInADay: { dayKey: DayKey; sessions: number } | null;
    mostHoursInAWeek: { weekStart: DayKey; hours: number } | null;
    longestDayAchievedStreak: number;
  };
  /** Khối 6 — giờ theo nhãn, theo TUẦN ([SỬA — 2026-09-06], trước đó theo tháng). */
  labelHoursByWeek: readonly { weekStart: DayKey; labels: readonly LabelHoursView[] }[];
};

export async function getLongTermStatsAction(): Promise<LongTermStatsData> {
  const nowMs = now();
  const todayKey = dayKeyOf(nowMs);

  const [raw, settings, labels] = await Promise.all([
    getEngineRawData(),
    getSettings(),
    listActiveLabels(),
  ]);

  // §5.8 [CHỐT]: một phiên hoàn thành = session_minutes + break_minutes. Viết theo công thức chứ
  // không phải hằng số 0,5 giờ — chủ dự án chỉnh được độ dài phiên (§4.3), con số giờ phải bám
  // theo cài đặt thật thay vì âm thầm sai đi. Vẫn dùng dù thẻ "Focus time" đã gỡ: khối 1 (tổng
  // cộng dồn), khối 5 (tuần nhiều giờ nhất) và khối 6 (giờ theo nhãn) đều tính giờ qua nó.
  const minutesPerSession = settings.sessionMinutes + settings.breakMinutes;

  const folded = foldTimeline(raw, nowMs);
  // Khung cắt tại ngày bắt đầu — lưới mở đầu bằng TUẦN ĐẦU của chủ dự án, không phải 12 tháng ô
  // rỗng trước khi app tồn tại ([CHỐT — 2026-09-06], §5.8).
  const windowDays = windowDaysOf(todayKey, STATS_WINDOW_MONTHS, raw.profileStartedDayKey);
  const months = windowMonthsOf(todayKey, STATS_WINDOW_MONTHS, raw.profileStartedDayKey);

  const lifetime = lifetimeTotals(raw.completedSessions, folded.dailySeries, minutesPerSession);
  const heatmap = heatmapCells(raw.completedSessions, windowDays);

  const weekStarts = weekStartsOf(windowDays);

  return {
    todayKey,
    lifetime: { ...lifetime, startedDayKey: raw.profileStartedDayKey },
    heatmap,
    monthlyTrend: monthlyStatTrend(folded.dailySeries, months),
    records: personalRecords(raw.completedSessions, folded.longestDayAchievedStreak, minutesPerSession),
    labelHoursByWeek: hoursByLabelPerWeek(raw.completedSessions, weekStarts, minutesPerSession).map((w) => ({
      weekStart: w.weekStart,
      labels: labels
        .map((l) => ({
          labelId: l.id,
          name: l.name,
          emoji: l.emoji,
          color: l.color,
          hours: w.hoursByLabelId.get(l.id) ?? 0,
        }))
        .filter((l) => l.hours > 0),
    })),
  };
}
