import { describe, expect, it } from "vitest";
import {
  chapterForNetWorth,
  chaptersNewlyReached,
  effectiveCharacterStage,
  isAdult,
  totalNetWorth,
} from "../../../core/engine/chapters";
import { CHAPTER_NET_WORTH_THRESHOLDS_VND, YOUNG_ADULT_STAGE } from "../../../core/balance";

describe("core/engine/chapters — totalNetWorth", () => {
  it("cộng hai nguồn — chứng khoán + vàng (§4.9)", () => {
    expect(totalNetWorth(30_000_000, 20_000_000)).toBe(50_000_000);
  });

  it("một nguồn bằng 0 vẫn cộng đúng", () => {
    expect(totalNetWorth(0, 100)).toBe(100);
  });
});

describe("core/engine/chapters — chapterForNetWorth", () => {
  it("dưới mốc Chương 2 → Chương 1", () => {
    expect(chapterForNetWorth(0)).toBe(1);
    expect(chapterForNetWorth(49_999_999)).toBe(1);
  });

  it("tài sản ÂM vẫn là Chương 1 — không có Chương 0", () => {
    expect(chapterForNetWorth(-5_000_000)).toBe(1);
  });

  it("đúng mốc chương → chương đó (biên đóng, ≥ chứ không phải >)", () => {
    expect(chapterForNetWorth(50_000_000)).toBe(2);
    expect(chapterForNetWorth(100_000_000)).toBe(3);
  });

  it("giữa hai mốc → chương thấp hơn", () => {
    expect(chapterForNetWorth(299_999_999)).toBe(3);
  });

  it("đúng mốc Chương 12 (26 tỉ) → Chương 12", () => {
    expect(chapterForNetWorth(26_000_000_000)).toBe(12);
  });

  it("vượt xa Chương 12 vẫn dừng ở 12 — không có chương 13", () => {
    expect(chapterForNetWorth(1_000_000_000_000)).toBe(12);
  });

  it("khớp đúng bảng SPEC.md §4.9 cho mọi mốc trong balance.ts", () => {
    CHAPTER_NET_WORTH_THRESHOLDS_VND.forEach((threshold, i) => {
      expect(chapterForNetWorth(threshold)).toBe(i + 1);
    });
  });
});

describe("core/engine/chapters — chaptersNewlyReached", () => {
  it("chưa từng ghi gì, tài sản ở Chương 1 → không ghi gì (Chương 1 không phải một 'sự kiện')", () => {
    expect(chaptersNewlyReached(0, 1)).toEqual([]);
  });

  it("chưa từng ghi gì, tài sản đã ở Chương 2 → ghi Chương 2 (không lùi ghi Chương 1)", () => {
    expect(chaptersNewlyReached(0, 2)).toEqual([2]);
  });

  it("nhảy vọt nhiều chương một lúc → ghi CẢ chương trung gian (§11.1 câu Q30)", () => {
    expect(chaptersNewlyReached(1, 5)).toEqual([2, 3, 4, 5]);
  });

  it("tài sản đi XUỐNG → không ghi gì, không xoá gì (§4.9: mốc cao nhất ghi vĩnh viễn)", () => {
    expect(chaptersNewlyReached(5, 3)).toEqual([]);
  });

  it("đứng yên đúng chương đã ghi → không ghi lại", () => {
    expect(chaptersNewlyReached(3, 3)).toEqual([]);
  });

  it("chạm Chương 12 lần đầu từ giữa chừng → ghi hết các chương còn thiếu tới 12", () => {
    expect(chaptersNewlyReached(9, 12)).toEqual([10, 11, 12]);
  });
});

describe("core/engine/chapters — isAdult / effectiveCharacterStage (§4.8, cần ĐỦ CẢ HAI)", () => {
  it("đủ cả hai điều kiện → Trưởng thành", () => {
    expect(isAdult(YOUNG_ADULT_STAGE, 12)).toBe(true);
    expect(effectiveCharacterStage(YOUNG_ADULT_STAGE, 12)).toBe(YOUNG_ADULT_STAGE + 1);
  });

  it("đủ Thanh niên nhưng CHƯA đủ Chương 12 → chưa Trưởng thành, giữ nguyên stage", () => {
    expect(isAdult(YOUNG_ADULT_STAGE, 11)).toBe(false);
    expect(effectiveCharacterStage(YOUNG_ADULT_STAGE, 11)).toBe(YOUNG_ADULT_STAGE);
  });

  it("đủ Chương 12 nhưng CHƯA đủ Thanh niên → chưa Trưởng thành, giữ nguyên stage", () => {
    expect(isAdult(5, 12)).toBe(false);
    expect(effectiveCharacterStage(5, 12)).toBe(5);
  });

  it("thiếu cả hai → chắc chắn chưa Trưởng thành", () => {
    expect(isAdult(3, 4)).toBe(false);
    expect(effectiveCharacterStage(3, 4)).toBe(3);
  });

  it("chương vượt xa 12 vẫn chỉ +1 bước — không có 'Trưởng thành cấp 2'", () => {
    expect(effectiveCharacterStage(YOUNG_ADULT_STAGE, 12)).toBe(YOUNG_ADULT_STAGE + 1);
    expect(effectiveCharacterStage(YOUNG_ADULT_STAGE, 20)).toBe(YOUNG_ADULT_STAGE + 1);
  });
});
