/**
 * Lịch và mốc ngày — SPEC.md §4.10. "Một ngày" chạy 04:00 → 03:59:59 hôm sau, giờ Việt Nam;
 * mọi mốc thời gian lưu UTC (số mili-giây epoch), hiển thị giờ Việt Nam.
 *
 * Mọi hàm ở đây nhận thời điểm làm THAM SỐ (`ms: number`) — không tự đọc đồng hồ (§8.3, §8.4).
 * Nơi gọi (trang, route API, test) lấy `now()` từ `core/clock.ts` rồi truyền xuống.
 */

import {
  DAY_BOUNDARY_HOUR,
  TIMEZONE,
  WEEK_START_ISO_WEEKDAY,
} from "./balance";
import type { DayKey, IsoWeekday } from "./types";

const dayKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

const localPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  // "h23" ép giờ 0-23 với nửa đêm là "00" — không dùng hour12:false vì một số runtime trả về
  // "24" cho nửa đêm thay vì "00", làm sai lệch phép so sánh DAY_BOUNDARY_HOUR.
  hourCycle: "h23",
});

interface LocalParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23, giờ Việt Nam
}

function localPartsAt(ms: number): LocalParts {
  const found: Partial<Record<string, string>> = {};
  for (const part of localPartsFormatter.formatToParts(new Date(ms))) {
    if (part.type !== "literal") found[part.type] = part.value;
  }
  const year = Number(found.year);
  const month = Number(found.month);
  const day = Number(found.day);
  const hour = Number(found.hour);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour)
  ) {
    throw new Error(`core/day.ts: không đọc được giờ Việt Nam từ ms=${ms}`);
  }
  return { year, month, day, hour };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDayKey(year: number, month: number, day: number): DayKey {
  return `${year}-${pad2(month)}-${pad2(day)}` as DayKey;
}

/**
 * Khoá ngày (`YYYY-MM-DD`) cho một thời điểm, theo mốc 04:00 giờ Việt Nam. Trước 4 giờ sáng
 * vẫn tính là ngày hôm trước — một đêm thức khuya không làm mất một ngày trong lịch sử (§4.10).
 */
export function dayKeyOf(ms: number): DayKey {
  const { year, month, day, hour } = localPartsAt(ms);
  if (hour < DAY_BOUNDARY_HOUR) {
    // Lùi đúng một ngày lịch bằng Date.UTC — tự cuộn qua cuối tháng/năm/năm nhuận, không cần
    // tự viết bảng "số ngày mỗi tháng".
    const prevNoonUtc = new Date(Date.UTC(year, month - 1, day - 1, 12));
    return formatDayKey(
      prevNoonUtc.getUTCFullYear(),
      prevNoonUtc.getUTCMonth() + 1,
      prevNoonUtc.getUTCDate(),
    );
  }
  return formatDayKey(year, month, day);
}

/** Mốc bắt đầu (04:00:00.000 giờ Việt Nam, tức UTC+7) của một `DayKey`, dạng mili-giây epoch. */
export function startOfDayMs(key: DayKey): number {
  const { year, month, day } = parseDayKey(key);
  // Asia/Ho_Chi_Minh không đổi giờ mùa (luôn UTC+7, không DST) — trừ thẳng 7 giờ ra UTC an toàn.
  return Date.UTC(year, month - 1, day, DAY_BOUNDARY_HOUR - 7);
}

/** Mốc kết thúc (03:59:59.999 giờ Việt Nam hôm SAU) của một `DayKey`, dạng mili-giây epoch —
 *  đối xứng với `startOfDayMs`, dùng khi cần "tính tới hết ngày X" (mốc 7, thư viện hành trình). */
export function endOfDayMs(key: DayKey): number {
  return startOfDayMs(addDays(key, 1)) - 1;
}

/** Phân rã một `DayKey` thành năm/tháng/ngày. Ném lỗi nếu không đúng định dạng `YYYY-MM-DD`. */
export function parseDayKey(key: DayKey): { year: number; month: number; day: number } {
  if (!dayKeyPattern.test(key)) {
    throw new Error(`core/day.ts: DayKey không đúng định dạng YYYY-MM-DD: "${key}"`);
  }
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

/** Cộng (hoặc trừ, nếu âm) một số ngày lịch vào một `DayKey`. */
export function addDays(key: DayKey, delta: number): DayKey {
  const { year, month, day } = parseDayKey(key);
  const shifted = new Date(Date.UTC(year, month - 1, day + delta, 12));
  return formatDayKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

/**
 * Đúng ngày này NĂM TRƯỚC — SPEC.md §5.5 ("hôm nay năm ngoái"). 29/2 năm nhuận mà năm trước
 * không nhuận thì tự cuộn sang 1/3 (đúng ngữ nghĩa `Date.UTC`, hiếm gặp, chấp nhận).
 */
export function oneYearAgo(key: DayKey): DayKey {
  const { year, month, day } = parseDayKey(key);
  const shifted = new Date(Date.UTC(year - 1, month - 1, day, 12));
  return formatDayKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

/** Thứ trong tuần của một `DayKey`, theo ISO: 1 = Thứ Hai … 7 = Chủ nhật. */
export function isoWeekdayOf(key: DayKey): IsoWeekday {
  const { year, month, day } = parseDayKey(key);
  const utcDay = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay(); // 0 = Chủ nhật .. 6 = Thứ Bảy
  return (utcDay === 0 ? 7 : utcDay) as IsoWeekday;
}

/** Thứ Hai của tuần chứa `key` (tuần chạy Thứ Hai → Chủ nhật — §11.2 câu Q29). */
export function mondayOf(key: DayKey): DayKey {
  const iso = isoWeekdayOf(key);
  return addDays(key, WEEK_START_ISO_WEEKDAY - iso);
}

/** Danh sách 7 `DayKey` của tuần chứa `key`, từ Thứ Hai tới Chủ nhật, theo đúng thứ tự. */
export function weekOf(key: DayKey): DayKey[] {
  const monday = mondayOf(key);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * Mọi `DayKey` từ `fromKey` tới `toKey`, HAI ĐẦU ĐỀU GỒM, theo thứ tự thời gian. Dùng cho
 * core/engine/timeline.ts để duyệt qua từng ngày kể từ lúc bắt đầu hồ sơ. Mảng rỗng nếu
 * `fromKey` sau `toKey`.
 *
 * So sánh hai `DayKey` bằng phép so sánh chuỗi thường (`<`, `<=`) là ĐỦ và ĐÚNG ở khắp file này
 * — định dạng `YYYY-MM-DD` với số 0 đệm trước tự nhiên xếp đúng thứ tự thời gian theo từ điển,
 * không cần hàm so sánh riêng.
 */
export function enumerateDayKeys(fromKey: DayKey, toKey: DayKey): DayKey[] {
  const result: DayKey[] = [];
  let cursor = fromKey;
  while (cursor <= toKey) {
    result.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return result;
}
