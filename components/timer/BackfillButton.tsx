"use client";

import { useState } from "react";
import type { LabelSeed } from "./labels";

type Props = {
  labels: readonly LabelSeed[];
  onBackfill: (labelId: string, count: number) => void;
};

/**
 * Ghi bù — cho lúc tôi làm việc mà quên bật đồng hồ. Chỉ ghi được cho hôm nay, không giới hạn
 * số phiên, không phạt gì (SPEC.md §4.3). Đánh dấu `backfilled: true` để màn tuần (mốc sau)
 * tính "% ghi bù" — không hiện cảnh báo gì ở đây, không phải lỗi của tôi.
 */
export function BackfillButton({ labels, onBackfill }: Props) {
  const [open, setOpen] = useState(false);
  const [labelId, setLabelId] = useState(labels[0]?.id ?? "");
  const [count, setCount] = useState(1);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-surface/90 px-4 py-2 text-sm font-semibold text-foreground/80 shadow-md backdrop-blur transition-transform active:scale-95 hover:bg-surface"
      >
        + Ghi bù
      </button>
    );
  }

  return (
    <div className="w-64 rounded-2xl bg-surface/95 p-4 shadow-lg backdrop-blur">
      <p className="mb-2 text-sm font-semibold text-foreground/80">Ghi bù cho hôm nay</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {labels.map((l) => (
          <button
            key={l.id}
            onClick={() => setLabelId(l.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              labelId === l.id
                ? "text-background"
                : "bg-surface-muted text-foreground/70 hover:bg-surface-muted/70"
            }`}
            style={labelId === l.id ? { backgroundColor: l.color } : undefined}
          >
            {l.emoji} {l.name}
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          className="h-7 w-7 rounded-full bg-surface-muted text-foreground/70 transition-transform active:scale-90"
          aria-label="Bớt một phiên"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold">{count}</span>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="h-7 w-7 rounded-full bg-surface-muted text-foreground/70 transition-transform active:scale-90"
          aria-label="Thêm một phiên"
        >
          +
        </button>
        <span className="text-xs text-foreground/60">phiên</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            onBackfill(labelId, count);
            setOpen(false);
            setCount(1);
          }}
          className="flex-1 rounded-full bg-foreground py-1.5 text-sm font-semibold text-background transition-transform active:scale-95"
        >
          Thêm
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/60 hover:bg-surface-muted"
        >
          Thôi
        </button>
      </div>
    </div>
  );
}
