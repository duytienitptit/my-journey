import { describe, expect, it } from "vitest";
import { decayAmountForDay } from "../../../core/engine/decay";
import { levelForXp, xpRequiredForLevel } from "../../../core/engine/levels";

describe("core/engine/decay — decayAmountForDay (§4.1)", () => {
  it("ngày 1, 2, 3 không nhận XP — chưa trừ (còn trong hạn)", () => {
    expect(decayAmountForDay(1, 10)).toBe(0);
    expect(decayAmountForDay(2, 10)).toBe(0);
    expect(decayAmountForDay(3, 10)).toBe(0);
  });

  it("ngày thứ 4 liên tiếp — bắt đầu trừ, đúng 20×cấp", () => {
    expect(decayAmountForDay(4, 10)).toBe(200);
  });

  it("ngày thứ 5, 6... vẫn tiếp tục trừ mỗi ngày (không phải trừ một lần)", () => {
    expect(decayAmountForDay(5, 10)).toBe(200);
    expect(decayAmountForDay(10, 10)).toBe(200);
  });

  it("cấp 0 vẫn trừ −20/ngày (max(1, cấp), không phải −0)", () => {
    expect(decayAmountForDay(4, 0)).toBe(20);
  });

  it("mức trừ tỉ lệ đúng với cấp hiện tại", () => {
    expect(decayAmountForDay(4, 1)).toBe(20);
    expect(decayAmountForDay(4, 30)).toBe(600);
  });
});

/**
 * SPEC.md §4.1 có một đoạn giải thích (không đánh [CHỐT], chỉ là ví dụ chủ dự án tự tính) nói
 * "bỏ bê liên tục 150 ngày thì cấp 10 về 0", suy ra từ "300n/20n = 15 ngày mỗi cấp". Mô phỏng
 * ĐÚNG luật [CHỐT] thật (trừ 20×cấp mỗi ngày, cấp tính lại mỗi ngày từ XP hiện tại — không phải
 * khoá cấp cho hết "gói 15 ngày" rồi mới đổi) cho ra một số KHÁC — vì ngày đầu tiên trừ ở cấp
 * cao đã kéo XP xuống dưới ngưỡng cấp đó, nên những ngày sau lập tức trừ theo cấp thấp hơn
 * (chậm hơn), kéo dài tổng thời gian ra. Đây không phải bug — luật [CHỐT] chỉ nói "−20×cấp hiện
 * tại mỗi ngày", không nói "khoá cấp 15 ngày rồi mới đổi". Số "191 ngày" dưới đây khoá lại làm
 * bài test hồi quy; nếu ai đó vô tình đổi công thức, test này báo ngay. Đã báo chủ dự án về
 * chênh lệch với "150 ngày" trong spec.
 */
describe("core/engine/decay — mô phỏng cấp 10 decay liên tục xuống 0 (§4.1, đối chiếu ví dụ trong spec)", () => {
  it("mất 191 ngày, không phải 150 như ước lượng trong SPEC.md", () => {
    let xp = xpRequiredForLevel(10);
    let days = 0;
    while (xp > 0) {
      const level = levelForXp(xp);
      const amount = decayAmountForDay(4, level); // giả định đã qua hạn từ trước, luôn ở "ngày thứ 4+"
      xp = Math.max(0, xp - amount);
      days++;
      if (days > 1000) throw new Error("vòng lặp không dừng — có bug");
    }
    expect(days).toBe(191);
  });

  it("tính chất đại số 300n/20n=15 vẫn đúng — chỉ không áp dụng nguyên vẹn khi mô phỏng liên tục", () => {
    for (const n of [1, 5, 10, 20, 30]) {
      const gap = xpRequiredForLevel(n) - xpRequiredForLevel(n - 1);
      const rate = 20 * n;
      expect(gap / rate).toBe(15);
    }
  });
});
