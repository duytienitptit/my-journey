/**
 * Mùa thật + ngày lễ — SPEC.md §5.3 "Mùa thật". Hàm thuần, nhận `DayKey` làm tham số (§8.4) —
 * nơi gọi tự lấy `dayKeyOf(now())` rồi truyền xuống, không tự đọc đồng hồ ở đây.
 *
 * Thứ tự ưu tiên: Tết (hiếm, đặc biệt nhất) > Giáng sinh > hai mùa theo tháng > mặc định. Một
 * ngày chỉ thuộc ĐÚNG MỘT trạng thái — không có chuyện vừa "Tết" vừa "mùa mưa" cùng lúc dù về
 * mặt tháng có thể trùng (Tết có năm rơi vào đầu tháng 2, vẫn ưu tiên Tết).
 */

import {
  CHRISTMAS_DAY,
  CHRISTMAS_MONTH,
  CHRISTMAS_WINDOW_DAYS_AFTER,
  CHRISTMAS_WINDOW_DAYS_BEFORE,
  RAINY_SEASON_MONTHS,
  SUMMER_MONTHS,
  TET_FIRST_DAY,
  TET_WINDOW_DAYS,
} from "../balance";
import { addDays, parseDayKey } from "../day";
import type { DayKey } from "../types";

export type SeasonKey = "tet" | "christmas" | "summer" | "rainy" | "default";

function isWithinTetWindow(key: DayKey): boolean {
  const { year } = parseDayKey(key);
  const tetStart = TET_FIRST_DAY[year];
  if (!tetStart) return false; // năm ngoài bảng — coi như không có Tết, không throw
  const tetEnd = addDays(tetStart, TET_WINDOW_DAYS - 1);
  return key >= tetStart && key <= tetEnd;
}

function isWithinChristmasWindow(key: DayKey): boolean {
  const { month, day } = parseDayKey(key);
  if (month !== CHRISTMAS_MONTH) return false;
  return day >= CHRISTMAS_DAY - CHRISTMAS_WINDOW_DAYS_BEFORE && day <= CHRISTMAS_DAY + CHRISTMAS_WINDOW_DAYS_AFTER;
}

/** Mùa/ngày lễ tại một `DayKey`. */
export function seasonOf(key: DayKey): SeasonKey {
  if (isWithinTetWindow(key)) return "tet";
  if (isWithinChristmasWindow(key)) return "christmas";
  const { month } = parseDayKey(key);
  if (SUMMER_MONTHS.includes(month)) return "summer";
  if (RAINY_SEASON_MONTHS.includes(month)) return "rainy";
  return "default";
}

/**
 * Đêm giao thừa (đêm liền trước mùng 1 Tết) của năm dương lịch chứa mùng 1 Tết đó — "khoảnh
 * khắc đáng nhớ" cho vật phẩm hiếm (SPEC.md §5.3). `null` nếu năm chưa có trong `TET_FIRST_DAY`.
 */
export function tetEveOf(year: number): DayKey | null {
  const tetStart = TET_FIRST_DAY[year];
  return tetStart ? addDays(tetStart, -1) : null;
}

/** Mọi năm (dương lịch) đã có trong `TET_FIRST_DAY` — dùng để duyệt tìm mọi đêm giao thừa đã
 *  từng xảy ra trong lịch sử app (core/engine/rareItems.ts). */
export function knownTetYears(): readonly number[] {
  return Object.keys(TET_FIRST_DAY).map(Number).sort((a, b) => a - b);
}
