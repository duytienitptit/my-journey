"use client";

import type { CheckInItem } from "@/app/actions/evening";

type LabelCheckInItem = Extract<CheckInItem, { kind: "label" }>;

type Props = {
  item: LabelCheckInItem;
  /** Chỉ true khi đang xem "Hôm nay" — ghi bù phiên không có khái niệm "hôm qua" (§4.3). */
  showButtons: boolean;
  onAdd: () => void;
  onRemove: () => void;
};

/**
 * Một dòng nhãn trong khối check-in (English/Deep work/New knowledge...) — [MỚI, 2026-09-16].
 * Trước đây không có chỗ nào hiện "đã làm bao nhiêu / cần bao nhiêu" cho các nhãn trong "6 việc"
 * (§4.5) — chỉ dải chấm rời rạc ở đầu trang, không kèm ngưỡng. Dùng cùng ngôn ngữ hình ảnh với
 * cặp nút +/- trong BackfillButton.tsx (nút tròn 7×7, bấm co lại nhẹ).
 *
 * "−" [THÊM — 2026-09-16, cùng ngày] — undo lỡ bấm thừa qua "+". Tự tắt khi `manualCount === 0`
 * (không còn phiên ghi bù nào của nhãn này hôm nay để xoá) — KHÔNG bao giờ cho phép bấm để rồi
 * server phải âm thầm bỏ qua, tránh số hiện lạc quan (optimistic) lệch khỏi DB thật.
 */
export function LabelProgressRow({ item, showButtons, onAdd, onRemove }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-foreground/80">
        {item.emoji} {item.name}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground/60">
          {item.count}/{item.threshold} sessions{item.done ? " ✓" : ""}
        </span>
        {showButtons && (
          <>
            <button
              onClick={onRemove}
              disabled={item.manualCount === 0}
              aria-label={`Remove one backfilled ${item.name} session`}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-foreground/70 transition-transform active:scale-90 hover:bg-surface-muted/70 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100"
            >
              −
            </button>
            <button
              onClick={onAdd}
              aria-label={`Add one ${item.name} session`}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-foreground/70 transition-transform active:scale-90 hover:bg-surface-muted/70"
            >
              +
            </button>
          </>
        )}
      </div>
    </div>
  );
}
