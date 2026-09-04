/**
 * Tài sản → chương — SPEC.md §4.9. Hàm thuần: (tổng tài sản VNĐ) → (chương). KHÔNG phải một
 * phần của `foldTimeline` (timeline.ts) — chương bám theo giá trị HIỆN TẠI (bản ghi
 * `net_worth_entries` mới nhất), không phải một phép fold theo ngày như XP. Đây là trục hoàn
 * toàn độc lập với ba chỉ số (§1: "Tài sản quyết định KÍCH THƯỚC, nỗ lực quyết định NHỮNG GÌ
 * TRONG ĐÓ") — file này không đọc XP, `timeline.ts` không đọc tài sản.
 *
 * `chapterEvents` (bảng DB, "chương CAO NHẤT từng chạm, ghi một lần") lại là chuyện khác — đó là
 * ghi chép lịch sử, không tính lại được (§4.9: "đừng tính lại bằng max() mỗi lần đọc"). Hàm
 * `chaptersNewlyReached` ở đây chỉ tính XEM cần ghi thêm dòng nào — việc ghi thật nằm ở
 * db/queries.ts (nơi duy nhất biết "đã ghi những chương nào rồi").
 */

import { ADULT_REQUIRES_CHAPTER, CHAPTER_NET_WORTH_THRESHOLDS_VND, YOUNG_ADULT_STAGE } from "../balance";

/** Tổng tài sản = chứng khoán + vàng (§4.9: "tổng tài sản từ hai nguồn"). */
export function totalNetWorth(stocksVnd: number, goldVnd: number): number {
  return stocksVnd + goldVnd;
}

/**
 * Chương ứng với một giá trị tài sản = chương LỚN NHẤT có mốc ≤ giá trị đó (§4.9). Tài sản âm
 * hoặc dưới mốc Chương 1 (0) vẫn là Chương 1 — không có "Chương 0".
 */
export function chapterForNetWorth(totalVnd: number): number {
  let chapter = 1;
  for (let i = 0; i < CHAPTER_NET_WORTH_THRESHOLDS_VND.length; i++) {
    if (totalVnd >= CHAPTER_NET_WORTH_THRESHOLDS_VND[i]) chapter = i + 1;
  }
  return chapter;
}

/**
 * Những chương MỚI cần ghi vào `chapter_events` khi tài sản vừa đổi — bao gồm cả chương TRUNG
 * GIAN nếu nhảy vọt nhiều chương một lúc (§4.9, §11.1 câu Q30: "ghi cả các chương trung gian").
 * `maxChapterEverReached` đọc từ DB (chương cao nhất đã có dòng trong `chapter_events`, 0 nếu
 * chưa từng ghi gì). Tài sản ĐI XUỐNG (newChapter ≤ maxChapterEverReached) không ghi gì thêm —
 * "mốc cao nhất ghi vĩnh viễn" (§4.9), nhà xuống theo giá trị hiện tại nhưng lịch sử không xoá.
 *
 * Chương 1 KHÔNG BAO GIỜ được ghi thành sự kiện — đó là điểm xuất phát mặc định (tài sản 0đ =
 * Chương 1, đúng ngay cả khi chưa nhập gì), không phải một cột mốc "tiến lên" do hành động nào
 * tạo ra. Thư viện hành trình (mốc 7) đọc `profile.started_at` cho câu chuyện Chương 1, không
 * cần dòng riêng ở đây.
 *
 * Trả về mảng RỖNG nếu không có chương mới nào — gọi nơi khác chỉ cần kiểm tra `.length`.
 */
export function chaptersNewlyReached(maxChapterEverReached: number, newChapter: number): number[] {
  const from = Math.max(2, maxChapterEverReached + 1);
  if (newChapter < from) return [];
  const result: number[] = [];
  for (let c = from; c <= newChapter; c++) result.push(c);
  return result;
}

/**
 * "Trưởng thành" — bước cuối cùng, cần ĐỦ CẢ HAI (§4.8): đã Thanh niên (giai đoạn XP cao nhất,
 * YOUNG_ADULT_STAGE) VÀ tài sản đã chạm chương cuối (ADULT_REQUIRES_CHAPTER = 12).
 */
export function isAdult(stage: number, chapter: number): boolean {
  return stage >= YOUNG_ADULT_STAGE && chapter >= ADULT_REQUIRES_CHAPTER;
}

/**
 * Giai đoạn nhân vật DÙNG ĐỂ HIỂN THỊ — `stage` (thuần XP, tối đa YOUNG_ADULT_STAGE = "Thanh
 * niên") cộng thêm đúng MỘT bước "Trưởng thành" khi đủ cả hai điều kiện ở trên. Không có gì ở
 * giữa: chưa đủ cả hai thì vẫn hiện đúng `stage` XP thật, không có "giai đoạn 9,5".
 */
export function effectiveCharacterStage(stage: number, chapter: number): number {
  return isAdult(stage, chapter) ? stage + 1 : stage;
}
