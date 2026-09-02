import { describe, expect, it } from "vitest";
import { advanceStreak, INITIAL_STREAK_STATE, newlyReachedMilestone } from "../../../core/engine/streaks";
import { STREAK_DAY_ACHIEVED_MILESTONES } from "../../../core/balance";

describe("core/engine/streaks — advanceStreak (§4.6)", () => {
  it("đạt liên tiếp → current tăng dần, longest theo kịp", () => {
    let state = INITIAL_STREAK_STATE;
    for (let i = 1; i <= 5; i++) {
      state = advanceStreak(state, true);
      expect(state.current).toBe(i);
      expect(state.longest).toBe(i);
    }
  });

  it("gãy chuỗi → current về 0, longest giữ nguyên (không mất gì — §4.6)", () => {
    let state = { current: 12, longest: 12 };
    state = advanceStreak(state, false);
    expect(state).toEqual({ current: 0, longest: 12 });
  });

  it("gãy rồi xây lại không vượt quá longest cũ thì longest không đổi", () => {
    let state = { current: 0, longest: 20 };
    state = advanceStreak(state, true);
    state = advanceStreak(state, true);
    expect(state).toEqual({ current: 2, longest: 20 });
  });

  it("xây lại và VƯỢT longest cũ thì longest cập nhật theo current mới", () => {
    let state = { current: 4, longest: 4 };
    state = advanceStreak(state, true); // current=5, vượt longest cũ
    expect(state).toEqual({ current: 5, longest: 5 });
  });
});

describe("core/engine/streaks — newlyReachedMilestone (§4.6: thưởng đúng một lần trong đời)", () => {
  it("chạm đúng mốc 7 lần đầu → trả về 7", () => {
    expect(newlyReachedMilestone(7, STREAK_DAY_ACHIEVED_MILESTONES, new Set())).toBe(7);
  });

  it("chạm mốc 7 nhưng đã thưởng rồi (ví dụ gãy rồi chạm lại) → không thưởng nữa", () => {
    expect(newlyReachedMilestone(7, STREAK_DAY_ACHIEVED_MILESTONES, new Set([7]))).toBeNull();
  });

  it("độ dài chuỗi không trùng mốc nào → null", () => {
    expect(newlyReachedMilestone(8, STREAK_DAY_ACHIEVED_MILESTONES, new Set())).toBeNull();
    expect(newlyReachedMilestone(29, STREAK_DAY_ACHIEVED_MILESTONES, new Set())).toBeNull();
  });

  it("mô phỏng cả một vòng đời chuỗi: chạm 7 → gãy → xây lại chạm 7 lần nữa KHÔNG thưởng lại", () => {
    const awarded = new Set<number>();
    let state = INITIAL_STREAK_STATE;
    // Xây tới 7 ngày liên tiếp.
    for (let i = 0; i < 7; i++) state = advanceStreak(state, true);
    expect(state.current).toBe(7);
    const first = newlyReachedMilestone(state.current, STREAK_DAY_ACHIEVED_MILESTONES, awarded);
    expect(first).toBe(7);
    if (first !== null) awarded.add(first);

    // Gãy, rồi xây lại đúng 7 ngày nữa.
    state = advanceStreak(state, false);
    for (let i = 0; i < 7; i++) state = advanceStreak(state, true);
    expect(state.current).toBe(7);
    expect(newlyReachedMilestone(state.current, STREAK_DAY_ACHIEVED_MILESTONES, awarded)).toBeNull();
  });
});
