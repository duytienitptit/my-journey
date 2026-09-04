"use server";

/**
 * Nhập tài sản + ẩn/hiện số — SPEC.md §4.9, mốc 5. Đọc lại toàn bộ (chương, số hiện tại) đi qua
 * `getComputedStatsAction` (app/actions/stats.ts) — file này chỉ có hai hành động GHI.
 */

import { setHideMoney, submitNetWorthEntry, type SubmitNetWorthResult } from "@/db/queries";

/**
 * Nhập một lần tài sản mới — LUÔN ghi thêm, không sửa/xoá bản ghi cũ (§4.9, §7: "giữ toàn bộ
 * lịch sử"). Không giới hạn tần suất, không hỏi lý do — "đừng bao giờ nhắc, đừng bao giờ ép".
 */
export async function submitNetWorthAction(
  stocksVnd: number,
  goldVnd: number,
  note?: string,
): Promise<SubmitNetWorthResult> {
  if (!Number.isFinite(stocksVnd) || !Number.isFinite(goldVnd)) {
    throw new Error("Stocks and gold must be numbers.");
  }
  if (stocksVnd < 0 || goldVnd < 0) {
    throw new Error("Stocks and gold must not be negative.");
  }
  return submitNetWorthEntry(Math.round(stocksVnd), Math.round(goldVnd), note?.trim() || undefined);
}

/** Trạng thái ẩn/hiện phải lưu lại, đừng để mất khi tải lại trang (§4.9, bản trước sai chỗ này). */
export async function setHideMoneyAction(hide: boolean): Promise<void> {
  await setHideMoney(hide);
}
