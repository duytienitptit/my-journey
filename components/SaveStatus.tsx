"use client";
import type { SaveState } from "./useAutosave";

export function SaveStatus({ status, error, onRetry }: { status: SaveState; error: string | null; onRetry: () => void }) {
  return <div className="flex items-center justify-between gap-3 text-xs text-foreground/80" aria-live="polite">
    <span role={status === "error" ? "alert" : undefined}>{error ?? (status === "saving" ? "Saving…" : "Saved ✓")}</span>
    {status === "error" && <button type="button" onClick={onRetry} className="shrink-0 rounded-full bg-surface-muted px-3 py-2 font-semibold">Save again</button>}
  </div>;
}
