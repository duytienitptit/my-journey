/**
 * Kiểu dữ liệu nền dùng khắp `core/`. File này không chứa logic và không chứa con số cân bằng
 * (những thứ đó thuộc `balance.ts` — SPEC.md §8.2). Chỉ có kiểu và hằng số liệt kê kiểu.
 */

/** Ba chỉ số của nhân vật — SPEC.md §4.1. Tên tiếng Anh chốt ở §8.5: Mind · Health · Spirit. */
export type StatKey = "mind" | "health" | "spirit";

/** Dùng để lặp qua ba chỉ số tại runtime (TypeScript union type không tự liệt kê được). */
export const STAT_KEYS: readonly StatKey[] = ["mind", "health", "spirit"];

/** Thứ trong tuần theo ISO: 1 = Thứ Hai … 7 = Chủ nhật. Tuần chạy Thứ Hai → Chủ nhật (§11.2 Q29). */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Khoá ngày dạng `YYYY-MM-DD`, theo mốc 4 giờ sáng giờ Việt Nam — SPEC.md §4.10.
 * Không phải giờ UTC nửa đêm; xem `core/day.ts#dayKeyOf`.
 */
export type DayKey = `${number}-${number}-${number}`;
