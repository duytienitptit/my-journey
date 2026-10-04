"use client";

import { useState } from "react";
import { useEscToClose } from "@/components/useEscToClose";
import type { TimerLabel } from "./TimerOverlay";

type Props = {
  labels: readonly TimerLabel[];
  onBackfill: (labelId: number, count: number) => Promise<boolean>;
};

/**
 * Ghi bù — cho lúc tôi làm việc mà quên bật đồng hồ. Chỉ ghi được cho hôm nay, không giới hạn
 * số phiên, không phạt gì (SPEC.md §4.3). Lưu `source: "manual"` để màn tuần (mốc sau) tính
 * "% ghi bù" — không hiện cảnh báo gì ở đây, không phải lỗi của tôi.
 */
export function BackfillButton({ labels, onBackfill }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [labelId, setLabelId] = useState<number>(labels[0]?.id ?? 0);
  const [count, setCount] = useState(1);
  useEscToClose(open, () => setOpen(false));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="backfill-trigger"
      >
        + Backfill
      </button>
    );
  }

  return (
    <div role="dialog" aria-label="Backfill for today" className="backfill-popover">
      {error && <p role="alert" className="mb-2 text-sm text-red-600">Could not confirm the save. Refresh status and check today’s count before adding again.</p>}
      <p className="mb-2 text-sm font-semibold text-foreground/80">Backfill for today</p>
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
            style={labelId === l.id ? { backgroundColor: `var(--stat-${l.stat})` } : undefined}
          >
            {l.emoji} {l.name}
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          className="h-7 w-7 rounded-full bg-surface-muted text-foreground/70 transition-transform active:scale-90"
          aria-label="Remove one session"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold">{count}</span>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="h-7 w-7 rounded-full bg-surface-muted text-foreground/70 transition-transform active:scale-90"
          aria-label="Add one session"
        >
          +
        </button>
        <span className="text-xs text-foreground/60">{count === 1 ? "session" : "sessions"}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            setPending(true);
            setError(false);
            const ok = await onBackfill(labelId, count);
            setPending(false);
            if (ok) setOpen(false);
            else setError(true);
          }}
          disabled={pending || labels.length === 0}
          className="flex-1 rounded-full bg-foreground py-1.5 text-sm font-semibold text-background transition-transform active:scale-95"
        >
          Add
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/60 hover:bg-surface-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
