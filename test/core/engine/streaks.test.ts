import { describe, expect, it } from "vitest";
import {
  advanceDayAchievedStreak,
  advanceStreak,
  INITIAL_DAY_ACHIEVED_STREAK_STATE,
  INITIAL_STREAK_STATE,
  newlyReachedMilestone,
} from "../../../core/engine/streaks";
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

describe("core/engine/streaks — advanceDayAchievedStreak, ân hạn 1 ngày (§4.6, [CHỐT — 2026-09-04])", () => {
  it("current=0 (chưa có gì) mà bỏ 1 ngày → KHÔNG vào nguy hiểm, ở yên tại 0", () => {
    const state = advanceDayAchievedStreak(INITIAL_DAY_ACHIEVED_STREAK_STATE, false, false);
    expect(state).toEqual({ current: 0, longest: 0, danger: false });
  });

  it("đạt bình thường (không trong nguy hiểm) → current+1 như advanceStreak thường, longest theo kịp", () => {
    let state = INITIAL_DAY_ACHIEVED_STREAK_STATE;
    for (let i = 1; i <= 5; i++) {
      state = advanceDayAchievedStreak(state, true, true);
      expect(state).toEqual({ current: i, longest: i, danger: false });
    }
  });

  it("đang có chuỗi (current>0) mà bỏ 1 ngày → vào nguy hiểm, current GIỮ NGUYÊN (chưa mất)", () => {
    const prev = { current: 5, longest: 5, danger: false };
    const state = advanceDayAchievedStreak(prev, false, false);
    expect(state).toEqual({ current: 5, longest: 5, danger: true });
  });

  it("đang nguy hiểm, ngày cứu ĐỦ 6/6 → nối tiếp như chưa từng bỏ (current+1, danger tắt)", () => {
    const prev = { current: 5, longest: 5, danger: true };
    const state = advanceDayAchievedStreak(prev, true, true); // achievedToday cũng true vì 6/6 dư sức đạt ngưỡng thường
    expect(state).toEqual({ current: 6, longest: 6, danger: false });
  });

  it("đang nguy hiểm, ngày cứu ĐỦ 6/6 và VƯỢT longest cũ → longest cập nhật theo", () => {
    const prev = { current: 5, longest: 5, danger: true };
    // longest chỉ nên vượt lên current MỚI (6), không phải nhảy vọt gì bất thường.
    const state = advanceDayAchievedStreak(prev, true, true);
    expect(state.longest).toBe(6);
  });

  it("đang nguy hiểm, ngày cứu KHÔNG đủ 6/6 (dù vẫn đạt ngưỡng thường 4/6) → gãy thật, về 0", () => {
    const prev = { current: 5, longest: 5, danger: true };
    // achievedToday=true (đạt ngưỡng thường) NHƯNG perfectToday=false (chưa đủ 6/6) — vẫn gãy,
    // vì ngưỡng CỨU cao hơn ngưỡng "đạt" thường (đây chính là điểm khác biệt cốt lõi).
    const state = advanceDayAchievedStreak(prev, true, false);
    expect(state).toEqual({ current: 0, longest: 5, danger: false });
  });

  it("đang nguy hiểm, ngày cứu bỏ luôn (không đạt gì cả) → gãy thật, về 0", () => {
    const prev = { current: 5, longest: 5, danger: true };
    const state = advanceDayAchievedStreak(prev, false, false);
    expect(state).toEqual({ current: 0, longest: 5, danger: false });
  });

  it("gãy thật rồi bỏ tiếp — KHÔNG vào nguy hiểm lần nữa (current đã về 0, không còn gì để cứu)", () => {
    let state = { current: 0, longest: 5, danger: false };
    state = advanceDayAchievedStreak(state, false, false);
    expect(state).toEqual({ current: 0, longest: 5, danger: false });
  });

  it("mô phỏng trọn vòng đời: xây 5 ngày → bỏ 1 (nguy hiểm) → cứu bằng 6/6 → xây tiếp bình thường", () => {
    let state = INITIAL_DAY_ACHIEVED_STREAK_STATE;
    for (let i = 0; i < 5; i++) state = advanceDayAchievedStreak(state, true, true);
    expect(state.current).toBe(5);

    state = advanceDayAchievedStreak(state, false, false); // bỏ 1 ngày
    expect(state.danger).toBe(true);
    expect(state.current).toBe(5); // chưa mất

    state = advanceDayAchievedStreak(state, true, true); // cứu bằng 6/6
    expect(state).toEqual({ current: 6, longest: 6, danger: false });

    state = advanceDayAchievedStreak(state, true, true); // xây tiếp bình thường, không cần 6/6 nữa
    expect(state).toEqual({ current: 7, longest: 7, danger: false });
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
