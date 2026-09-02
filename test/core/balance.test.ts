import { describe, expect, it } from "vitest";
import * as balance from "../../core/balance";

// Đây không phải test hành vi (balance.ts chỉ là dữ liệu) mà test TÍNH NHẤT QUÁN NỘI TẠI —
// canh giữ những tính chất mà SPEC.md đã tính tay, để không ai vô tình sửa một hằng số làm
// gãy tính chất đó mà không biết (ví dụ mốc chuỗi phải chia hết cho 3, luật "15 ngày = 1 cấp").

describe("core/balance — cấp độ khớp bảng SPEC.md §4.8", () => {
  const table: Array<[level: number, xp: number]> = [
    [1, 300],
    [5, 4500],
    [10, 16500],
    [15, 36000],
    [20, 63000],
    [30, 139500],
  ];

  it.each(table)("cấp %d cần %d XP", (level, xp) => {
    expect(balance.LEVEL_XP_COEFFICIENT * level * (level + 1)).toBe(xp);
  });
});

describe("core/balance — tính chất '15 ngày bỏ bê = mất một cấp', mọi cấp (SPEC.md §4.1)", () => {
  it.each([2, 3, 10, 15, 20, 30])("đúng ở cấp %d", (level) => {
    const gapToNextLevelXp =
      balance.LEVEL_XP_COEFFICIENT * level * (level + 1) -
      balance.LEVEL_XP_COEFFICIENT * (level - 1) * level;
    const dailyDecayAtThisLevel = balance.DECAY_RATE_PER_LEVEL * level;
    expect(gapToNextLevelXp / dailyDecayAtThisLevel).toBe(15);
  });
});

describe("core/balance — giai đoạn nhân vật", () => {
  it("208.000 XP là ngưỡng Thanh niên, đúng giai đoạn 9", () => {
    expect(balance.STAGE_XP_THRESHOLDS).toHaveLength(balance.YOUNG_ADULT_STAGE);
    expect(balance.STAGE_XP_THRESHOLDS.at(-1)).toBe(208_000);
  });

  it("ngưỡng tăng dần nghiêm ngặt", () => {
    for (let i = 1; i < balance.STAGE_XP_THRESHOLDS.length; i++) {
      expect(balance.STAGE_XP_THRESHOLDS[i]).toBeGreaterThan(balance.STAGE_XP_THRESHOLDS[i - 1]);
    }
  });
});

describe("core/balance — 12 chương tài sản", () => {
  it("đúng 12 chương, mốc tăng dần nghiêm ngặt", () => {
    expect(balance.CHAPTER_NET_WORTH_THRESHOLDS_VND).toHaveLength(12);
    const t = balance.CHAPTER_NET_WORTH_THRESHOLDS_VND;
    for (let i = 1; i < t.length; i++) {
      expect(t[i]).toBeGreaterThan(t[i - 1]);
    }
  });

  it("chương 12 cố định 26 tỉ VNĐ, không quy đổi USD (§11.2 câu Q31/R7)", () => {
    expect(balance.CHAPTER_NET_WORTH_THRESHOLDS_VND.at(-1)).toBe(26_000_000_000);
  });
});

describe("core/balance — mốc chuỗi chia hết cho 3 chỉ số (§11.2 câu Q28)", () => {
  it.each(Object.entries(balance.STREAK_DAY_ACHIEVED_MILESTONES))(
    "mốc %s ngày (%s XP) chia hết cho 3",
    (_days, xp) => {
      expect(Number(xp) % 3).toBe(0);
    },
  );

  it("mốc 30 ngày là 450, không phải 500", () => {
    expect(balance.STREAK_DAY_ACHIEVED_MILESTONES[30]).toBe(450);
  });

  it("chuỗi nhật ký không có mốc 365 (đúng bảng SPEC.md §4.6)", () => {
    expect(balance.STREAK_JOURNAL_MILESTONES[365]).toBeUndefined();
  });
});

describe("core/balance — thưởng ngày đạt chia hết 3 chỉ số", () => {
  it("30 XP chia đều 10/10/10", () => {
    expect(balance.XP_DAY_ACHIEVED % 3).toBe(0);
    expect(balance.XP_DAY_ACHIEVED / 3).toBe(10);
  });
});

describe("core/balance — số việc cần đạt theo thứ (§4.5)", () => {
  it("Thứ 2 → Thứ 6 cần 4/6, Thứ 7 cần 3/6, Chủ nhật chỉ cần nhật ký", () => {
    for (const weekday of [1, 2, 3, 4, 5] as const) {
      expect(balance.DAY_ACHIEVED_REQUIRED_COUNT[weekday]).toBe(4);
    }
    expect(balance.DAY_ACHIEVED_REQUIRED_COUNT[6]).toBe(3);
    expect(balance.DAY_ACHIEVED_REQUIRED_COUNT[7]).toBe("journal_only");
  });
});

describe("core/balance — không có nghỉ dài (§11.3 câu S4)", () => {
  it("không xuất khẩu hằng số nghỉ dài nào", () => {
    expect(Object.keys(balance)).not.toContain("LONG_BREAK_MINUTES");
    expect(Object.keys(balance)).not.toContain("SESSIONS_BEFORE_LONG_BREAK");
  });
});
