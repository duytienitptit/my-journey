/**
 * Hai chuỗi song song, độc lập — SPEC.md §4.6. Hàm thuần: (trạng thái chuỗi hôm qua, hôm nay có
 * đạt/có viết không) → trạng thái chuỗi mới. `timeline.ts` gọi hàm này cho MỖI NGÀY ĐÃ QUA
 * (không gọi cho hôm nay — §4.6: "chuỗi tính tới hết hôm qua", xem ghi chú ở đó).
 */

export type StreakState = {
  current: number;
  longest: number;
};

export const INITIAL_STREAK_STATE: StreakState = { current: 0, longest: 0 };

/** Gãy chuỗi không mất gì — số hiện tại về 0, số dài nhất giữ vĩnh viễn (§4.6). */
export function advanceStreak(prev: StreakState, achievedToday: boolean): StreakState {
  if (!achievedToday) return { current: 0, longest: prev.longest };
  const current = prev.current + 1;
  return { current, longest: Math.max(prev.longest, current) };
}

/**
 * Mốc chuỗi vừa chạm hôm nay chưa từng thưởng bao giờ (§4.6: "mỗi mốc thưởng đúng một lần
 * trong đời"). `streakLength` chỉ tăng đúng 1 mỗi ngày đạt nên không thể nhảy qua nhiều mốc
 * cùng lúc — trả về NHIỀU NHẤT một mốc mỗi lần gọi.
 */
export function newlyReachedMilestone(
  streakLength: number,
  milestones: Readonly<Record<number, number>>,
  alreadyAwarded: ReadonlySet<number>,
): number | null {
  if (streakLength in milestones && !alreadyAwarded.has(streakLength)) {
    return streakLength;
  }
  return null;
}
