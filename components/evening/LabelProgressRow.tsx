"use client";

import type { CheckInItem } from "@/app/actions/evening";

type LabelCheckInItem = Extract<CheckInItem, { kind: "label" }>;

type Props = {
  item: LabelCheckInItem;
  /** Chỉ true khi đang xem "Hôm nay" — ghi bù phiên không có khái niệm "hôm qua" (§4.3). */
  showAddButton: boolean;
  onAdd: () => void;
};

/**
 * Một dòng nhãn trong khối check-in (English/Deep work/New knowledge...) — [MỚI, 2026-09-16].
 * Trước đây không có chỗ nào hiện "đã làm bao nhiêu / cần bao nhiêu" cho các nhãn trong "6 việc"
 * (§4.5) — chỉ dải chấm rời rạc ở đầu trang, không kèm ngưỡng. Dùng cùng ngôn ngữ hình ảnh với
 * cặp nút +/- trong BackfillButton.tsx (nút tròn 7×7, bấm co lại nhẹ).
 */
export function LabelProgressRow({ item, showAddButton, onAdd }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-foreground/80">
        {item.emoji} {item.name}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground/60">
          {item.count}/{item.threshold} sessions{item.done ? " ✓" : ""}
        </span>
        {showAddButton && (
          <button
            onClick={onAdd}
            aria-label={`Add one ${item.name} session`}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-foreground/70 transition-transform active:scale-90 hover:bg-surface-muted/70"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
