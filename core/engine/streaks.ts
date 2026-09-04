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

// ─── Chuỗi ngày-đạt: MỘT NGÀY ÂN HẠN — SPEC.md §4.6, [CHỐT — 2026-09-04] ────────────────────
// Chỉ chuỗi ngày-đạt có ân hạn; chuỗi nhật ký vẫn dùng advanceStreak thường ở trên (gãy là về 0
// ngay, không ân hạn) — chủ dự án đã xác nhận phạm vi này.

export type DayAchievedStreakState = StreakState & {
  /** Bỏ lỡ đúng hôm qua, còn đúng HÔM NAY để cứu — hết hôm nay mà vẫn không đủ 6/6 thì gãy thật. */
  danger: boolean;
};

export const INITIAL_DAY_ACHIEVED_STREAK_STATE: DayAchievedStreakState = { current: 0, longest: 0, danger: false };

/**
 * Khác `advanceStreak` thường ở chỗ: bỏ lỡ 1 ngày KHÔNG lập tức về 0 — vào trạng thái "nguy
 * hiểm", số hiện tại giữ nguyên. Ngày kế tiếp (khi `prev.danger === true`) là cơ hội DUY NHẤT để
 * cứu: đủ CẢ 6 việc (`perfectToday` — ngưỡng cao hơn hẳn `achievedToday` thường, xem
 * `dayAchieved.ts#isDayPerfect`) thì nối tiếp như chưa từng bỏ (hôm nay tính +1 bình thường,
 * ngày bỏ không tính nhưng cũng không xoá); không đủ thì gãy thật, về 0. Không có "ân hạn dây
 * chuyền" — đang nguy hiểm mà hôm nay lại bỏ tiếp (không đạt, không perfect) thì gãy luôn, không
 * lùi thêm hạn nữa.
 *
 * `current === 0` từ trước (chưa có gì để mất) thì bỏ 1 ngày không cần vào "nguy hiểm" — ở yên
 * tại 0, đúng hành vi cũ, đỡ phải "cứu" một chuỗi rỗng.
 */
export function advanceDayAchievedStreak(
  prev: DayAchievedStreakState,
  achievedToday: boolean,
  perfectToday: boolean,
): DayAchievedStreakState {
  if (prev.danger) {
    if (perfectToday) {
      const current = prev.current + 1;
      return { current, longest: Math.max(prev.longest, current), danger: false };
    }
    return { current: 0, longest: prev.longest, danger: false };
  }
  if (achievedToday) {
    const current = prev.current + 1;
    return { current, longest: Math.max(prev.longest, current), danger: false };
  }
  if (prev.current > 0) {
    return { current: prev.current, longest: prev.longest, danger: true };
  }
  return { current: 0, longest: prev.longest, danger: false };
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
