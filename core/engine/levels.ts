/**
 * Cấp mỗi chỉ số + giai đoạn nhân vật — SPEC.md §4.8. Hàm thuần: (XP) → (cấp/giai đoạn).
 */

import { LEVEL_XP_COEFFICIENT, STAGE_XP_THRESHOLDS } from "../balance";

/** XP tích luỹ cần có để ĐẠT cấp n (n ≥ 0; cấp 0 cần 0 XP — phòng trống). */
export function xpRequiredForLevel(n: number): number {
  if (n <= 0) return 0;
  return LEVEL_XP_COEFFICIENT * n * (n + 1);
}

/**
 * Cấp lớn nhất mà `xp` XP tích luỹ đạt được. Dùng công thức bậc hai đóng để ước lượng rồi tự
 * chỉnh ±1 quanh biên — tránh bug lệch một cấp do sai số dấu phẩy động của Math.sqrt.
 */
export function levelForXp(xp: number): number {
  if (xp <= 0) return 0;
  let n = Math.floor((-1 + Math.sqrt(1 + (4 * xp) / LEVEL_XP_COEFFICIENT)) / 2);
  if (n < 0) n = 0;
  while (xpRequiredForLevel(n + 1) <= xp) n++;
  while (n > 0 && xpRequiredForLevel(n) > xp) n--;
  return n;
}

/** Giai đoạn (1-based) mà `totalXp` (tổng ba chỉ số) đạt được — không tính điều kiện Trưởng thành. */
export function stageForTotalXp(totalXp: number): number {
  let stage = 1;
  for (let i = 0; i < STAGE_XP_THRESHOLDS.length; i++) {
    if (totalXp >= STAGE_XP_THRESHOLDS[i]) stage = i + 1;
  }
  return stage;
}
