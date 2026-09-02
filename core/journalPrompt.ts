import { parseDayKey } from "./day";
import type { DayKey } from "./types";

/**
 * Chọn chỉ số câu gợi ý nhật ký cho một ngày — hàm thuần, đổi mỗi ngày (§5.1: "một câu gợi ý
 * đổi mỗi ngày"), nhưng CÙNG một ngày luôn ra cùng một câu (tải lại trang không đổi câu giữa
 * chừng). Không cần ngẫu nhiên thật — chỉ cần xoay vòng đều qua danh sách.
 */
export function promptIndexForDay(key: DayKey, promptCount: number): number {
  if (promptCount <= 0) return 0;
  const { year, month, day } = parseDayKey(key);
  const ordinal = year * 372 + month * 31 + day; // đơn điệu theo lịch — đủ để xoay vòng đều
  return ((ordinal % promptCount) + promptCount) % promptCount;
}
