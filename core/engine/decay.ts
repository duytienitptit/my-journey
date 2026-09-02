/**
 * Trừ XP khi bỏ bê — SPEC.md §4.1. Hàm thuần: (số ngày liên tiếp không nhận XP tính tới hôm
 * nay, cấp hiện tại) → mức trừ hôm nay. `timeline.ts` giữ bộ đếm "số ngày liên tiếp" qua các
 * ngày; file này không tự đếm, chỉ tính một ngày.
 */

import { DECAY_GRACE_DAYS, DECAY_RATE_PER_LEVEL } from "../balance";

/**
 * Mức trừ cho MỘT ngày, khi chỉ số đó không nhận XP nào ngày đó.
 * `consecutiveZeroXpDays` TÍNH CẢ hôm nay — ví dụ hôm nay là ngày thứ 4 liên tiếp 0 XP thì
 * truyền 4. Ba ngày đầu (1,2,3) không trừ; từ ngày thứ 4 trở đi mới trừ, đúng mỗi ngày đó.
 */
export function decayAmountForDay(consecutiveZeroXpDays: number, currentLevel: number): number {
  if (consecutiveZeroXpDays <= DECAY_GRACE_DAYS) return 0;
  return DECAY_RATE_PER_LEVEL * Math.max(1, currentLevel);
}
