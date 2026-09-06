/**
 * Thống kê dài hạn — SPEC.md §5.8, màn `/stats`. Hàm thuần, không đụng DB, không đụng React
 * (§8.4). Tất cả nhận `dailySeries` mà `foldTimeline` đã nhả ra sẵn trong CÙNG một pass — không
 * gọi lại `foldTimeline` lần nào ở đây (khác `journeyLibrary.ts`, nơi buộc phải gọi lại vì mỗi
 * chương cần một `nowMs` khác nhau).
 *
 * Khung thời gian: 12 tháng gần nhất, khung LĂN (`STATS_WINDOW_MONTHS`). Đúng HAI ngoại lệ tính
 * toàn thời gian — `lifetimeTotals` (khối 1) và `personalRecords` (khối 5); xem §5.8.
 */

import { addDays, mondayOf, parseDayKey } from "../day";
import { STAT_KEYS, type DayKey, type StatKey } from "../types";
import type { DailyTimelinePoint, RawCompletedSession } from "./types";

/** `YYYY-MM` — khoá tháng, so sánh được bằng `<` như DayKey. */
export type MonthKey = string;

// Hằng số về THỜI GIAN, không phải số cân bằng — cố ý để tại chỗ chứ không đưa vào `balance.ts`
// (§8.2 dành cho số chủ dự án chỉnh: XP, ngưỡng, mốc — không phải "một giờ có 60 phút").
const MONTH_KEY_LENGTH = 7; // "YYYY-MM"
const MONTHS_IN_YEAR = 12;
const MINUTES_PER_HOUR = 60;

export function monthKeyOf(dayKey: DayKey): MonthKey {
  return dayKey.slice(0, MONTH_KEY_LENGTH);
}

/**
 * `count` khoá tháng gần nhất, cũ → mới, tháng cuối cùng là tháng chứa `todayKey`. Đi lùi bằng
 * số học trên (năm, tháng) chứ không bằng `Date` — tránh hoàn toàn chuyện lệch múi giờ.
 */
export function lastMonthKeys(todayKey: DayKey, count: number): MonthKey[] {
  const { year, month } = parseDayKey(todayKey);
  const keys: MonthKey[] = [];
  for (let i = count - 1; i >= 0; i--) {
    // month là 1-based; đổi sang chỉ số tuyệt đối để trừ rồi đổi ngược lại.
    const absolute = year * MONTHS_IN_YEAR + (month - 1) - i;
    const y = Math.floor(absolute / MONTHS_IN_YEAR);
    const m = (absolute % MONTHS_IN_YEAR) + 1;
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return keys;
}

/** Ngày đầu tiên của khung 12 tháng — mùng 1 của tháng cũ nhất, để cả 12 tháng đều TRỌN VẸN. */
export function windowStartDayKey(todayKey: DayKey, months: number): DayKey {
  const first = lastMonthKeys(todayKey, months)[0];
  return `${first}-01` as DayKey;
}

// ─── Khối 1 — tổng cộng dồn từ ngày đầu (TOÀN THỜI GIAN) ──────────────────

export type LifetimeTotals = {
  totalSessions: number;
  /** Giờ, chưa làm tròn — tầng hiển thị tự làm tròn (§8.4: engine không lo trình bày). */
  totalHours: number;
  daysAchieved: number;
};

/**
 * `minutesPerSession` = `session_minutes + break_minutes` (§5.8) — tầng gọi đọc từ bảng
 * `settings` và cộng lại, KHÔNG phải hằng số 0,5 giờ viết cứng ở đây. Chủ dự án chỉnh được độ
 * dài phiên (§4.3 [CHỐT]), nên con số giờ phải bám theo cài đặt.
 */
export function lifetimeTotals(
  completedSessions: readonly RawCompletedSession[],
  dailySeries: readonly DailyTimelinePoint[],
  minutesPerSession: number,
): LifetimeTotals {
  const totalSessions = completedSessions.length;
  return {
    totalSessions,
    totalHours: (totalSessions * minutesPerSession) / MINUTES_PER_HOUR,
    daysAchieved: dailySeries.reduce((n, point) => n + (point.dayAchieved ? 1 : 0), 0),
  };
}

// ─── Khối 2 — bản đồ nhiệt ────────────────────────────────────────────────

export type HeatmapCell = { dayKey: DayKey; sessions: number };

/** Số phiên HOÀN THÀNH mỗi ngày, đủ mọi ngày trong khung (ngày trống vẫn có ô, `sessions: 0`). */
export function heatmapCells(
  completedSessions: readonly RawCompletedSession[],
  windowDays: readonly DayKey[],
): HeatmapCell[] {
  const byDay = new Map<DayKey, number>();
  for (const s of completedSessions) byDay.set(s.dayKey, (byDay.get(s.dayKey) ?? 0) + 1);
  return windowDays.map((dayKey) => ({ dayKey, sessions: byDay.get(dayKey) ?? 0 }));
}

// ─── Khối 3 — xu hướng ba chỉ số theo tháng ───────────────────────────────

export type MonthlyStatPoint = { month: MonthKey; xpByStat: Record<StatKey, number> };

/**
 * XP ba chỉ số tại thời điểm KẾT THÚC mỗi tháng. Tháng chưa có ngày nào trong `dailySeries`
 * (trước khi chủ dự án bắt đầu dùng app) thì mang XP của điểm gần nhất TRƯỚC nó — không phải 0,
 * vì XP là đại lượng cộng dồn, "chưa có bản ghi" không có nghĩa là "tụt về 0". Tháng nằm hoàn
 * toàn trước ngày đầu tiên thì đúng là 0.
 */
export function monthlyStatTrend(
  dailySeries: readonly DailyTimelinePoint[],
  months: readonly MonthKey[],
): MonthlyStatPoint[] {
  // Điểm CUỐI CÙNG của mỗi tháng có mặt trong chuỗi.
  const lastOfMonth = new Map<MonthKey, Record<StatKey, number>>();
  for (const point of dailySeries) lastOfMonth.set(monthKeyOf(point.dayKey), point.xpByStat);

  let carried: Record<StatKey, number> = { mind: 0, health: 0, spirit: 0 };
  return months.map((month) => {
    const found = lastOfMonth.get(month);
    if (found) carried = found;
    return { month, xpByStat: { ...carried } };
  });
}

// ─── Khối 4 + 6 — giờ ─────────────────────────────────────────────────────

export function hoursOf(sessionCount: number, minutesPerSession: number): number {
  return (sessionCount * minutesPerSession) / MINUTES_PER_HOUR;
}

export type WeeklyLabelHours = { weekStart: DayKey; hoursByLabelId: ReadonlyMap<number, number> };

/**
 * Mọi tuần trong khung, cũ → mới, mỗi tuần nhận ngày THỨ HAI của nó làm khoá — cùng cách chia
 * tuần với bản đồ nhiệt ngay phía trên, nên hai biểu đồ đọc chung một nhịp.
 */
export function weekStartsOf(windowDays: readonly DayKey[]): DayKey[] {
  const seen = new Set<DayKey>();
  const weeks: DayKey[] = [];
  for (const day of windowDays) {
    const week = mondayOf(day);
    if (!seen.has(week)) {
      seen.add(week);
      weeks.push(week);
    }
  }
  return weeks;
}

/**
 * Giờ theo từng nhãn, theo từng TUẦN — [SỬA — 2026-09-06], trước đó gom theo tháng. Chủ dự án
 * xem bản theo tháng rồi yêu cầu đổi: một cột mỗi tháng chỉ cho 12 điểm trong cả năm, quá thô để
 * thấy "nhãn nào bị bỏ đói" bắt đầu từ tuần nào — mà chính chủ dự án cũng đã chốt "một cột = một
 * tuần của tôi" cho bản đồ nhiệt (§5.8), nên hai biểu đồ giờ cùng một đơn vị.
 */
export function hoursByLabelPerWeek(
  completedSessions: readonly RawCompletedSession[],
  weekStarts: readonly DayKey[],
  minutesPerSession: number,
): WeeklyLabelHours[] {
  const counts = new Map<DayKey, Map<number, number>>();
  for (const s of completedSessions) {
    const week = mondayOf(s.dayKey);
    let bucket = counts.get(week);
    if (!bucket) {
      bucket = new Map<number, number>();
      counts.set(week, bucket);
    }
    bucket.set(s.labelId, (bucket.get(s.labelId) ?? 0) + 1);
  }
  return weekStarts.map((weekStart) => {
    const bucket = counts.get(weekStart);
    const hoursByLabelId = new Map<number, number>();
    if (bucket) for (const [labelId, n] of bucket) hoursByLabelId.set(labelId, hoursOf(n, minutesPerSession));
    return { weekStart, hoursByLabelId };
  });
}

// ─── Khối 5 — kỷ lục cá nhân (TOÀN THỜI GIAN) ─────────────────────────────

export type PersonalRecords = {
  mostSessionsInADay: { dayKey: DayKey; sessions: number } | null;
  mostHoursInAWeek: { weekStart: DayKey; hours: number } | null;
  /** Đã tính sẵn trong `foldTimeline` theo đúng luật ân hạn §4.6 — chỉ chuyển tiếp ra đây. */
  longestDayAchievedStreak: number;
};

export function personalRecords(
  completedSessions: readonly RawCompletedSession[],
  longestDayAchievedStreak: number,
  minutesPerSession: number,
): PersonalRecords {
  const byDay = new Map<DayKey, number>();
  const byWeek = new Map<DayKey, number>();
  for (const s of completedSessions) {
    byDay.set(s.dayKey, (byDay.get(s.dayKey) ?? 0) + 1);
    const week = mondayOf(s.dayKey);
    byWeek.set(week, (byWeek.get(week) ?? 0) + 1);
  }

  // Hoà nhau thì giữ ngày/tuần SỚM NHẤT — kỷ lục thuộc về lần đầu tiên chạm tới.
  let bestDay: { dayKey: DayKey; sessions: number } | null = null;
  for (const [dayKey, sessions] of byDay) {
    if (!bestDay || sessions > bestDay.sessions || (sessions === bestDay.sessions && dayKey < bestDay.dayKey)) {
      bestDay = { dayKey, sessions };
    }
  }
  let bestWeek: { weekStart: DayKey; hours: number } | null = null;
  for (const [weekStart, n] of byWeek) {
    const hours = hoursOf(n, minutesPerSession);
    if (!bestWeek || hours > bestWeek.hours || (hours === bestWeek.hours && weekStart < bestWeek.weekStart)) {
      bestWeek = { weekStart, hours };
    }
  }
  return { mostSessionsInADay: bestDay, mostHoursInAWeek: bestWeek, longestDayAchievedStreak };
}

// ─── Tiện ích dùng chung cho tầng gọi ─────────────────────────────────────

/**
 * Mọi ngày trong khung, cũ → mới. Tách riêng để test được mà không cần dựng cả EngineRawData.
 *
 * `startedDayKey` CẮT khung lại: không bao giờ lùi về trước ngày chủ dự án bắt đầu dùng app
 * ([CHỐT — 2026-09-06], sau khi chủ dự án nhìn lưới thật). Nếu không cắt, người mới dùng một
 * tuần vẫn thấy gần 12 tháng ô rỗng trải dài phía trước — lưới trông như một năm bỏ bê chứ không
 * phải tuần đầu tiên. Cột đầu tiên vì vậy chính là TUẦN ĐẦU của chủ dự án; những ngày trước ngày
 * bắt đầu trong chính tuần đó được chừa trống (xem phần chèn ô rỗng ở YearHeatmap.tsx).
 *
 * Khung 12 tháng lăn vẫn giữ nguyên vai trò TRẦN TRÊN — qua một năm sử dụng thì nó lại là cạnh
 * quyết định, và lưới thôi dài thêm.
 */
export function windowDaysOf(todayKey: DayKey, months: number, startedDayKey?: DayKey): DayKey[] {
  const rolling = windowStartDayKey(todayKey, months);
  const start = startedDayKey && startedDayKey > rolling ? startedDayKey : rolling;
  const days: DayKey[] = [];
  for (let day = start; day <= todayKey; day = addDays(day, 1)) days.push(day);
  return days;
}

/**
 * Các tháng của khung, đã CẮT bỏ những tháng nằm hoàn toàn trước ngày bắt đầu — cùng lý do với
 * `windowDaysOf`: biểu đồ xu hướng và biểu đồ giờ theo nhãn không nên mở đầu bằng 11 cột rỗng.
 */
export function windowMonthsOf(todayKey: DayKey, months: number, startedDayKey?: DayKey): MonthKey[] {
  const all = lastMonthKeys(todayKey, months);
  if (!startedDayKey) return all;
  const startMonth = monthKeyOf(startedDayKey);
  const trimmed = all.filter((m) => m >= startMonth);
  // Bắt đầu dùng app TRƯỚC khung 12 tháng → không còn tháng nào bị cắt, giữ nguyên cả 12.
  return trimmed.length > 0 ? trimmed : all;
}

/** Tổng XP ba chỉ số của một điểm — dùng cho trục dọc của biểu đồ xu hướng. */
export function totalXpOf(point: MonthlyStatPoint): number {
  return STAT_KEYS.reduce((sum, stat) => sum + point.xpByStat[stat], 0);
}
