"use client";

import { useState } from "react";
import Link from "next/link";
import { getArchiveDataAction, type ArchiveData } from "@/app/actions/archive";
import { MOOD_EMOJI } from "@/components/evening/MoodPicker";
import type { DayKey } from "@/core/types";

function formatDayKeyLong(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function EntryCard({ dayKey, mood, text }: { dayKey: string; mood: number | null; text: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-foreground/50">
        <span>{formatDayKeyLong(dayKey)}</span>
        {mood !== null && <span className="text-base">{MOOD_EMOJI[mood]}</span>}
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground/80">{text}</p>
    </div>
  );
}

/** Kho lưu trữ — SPEC.md §5.5, mốc 7. Đọc lại nhật ký, lọc theo ngày, "hôm nay năm ngoái". */
export function ArchiveScreen({ initialData }: { initialData: ArchiveData }) {
  const [data, setData] = useState(initialData);
  const [from, setFrom] = useState<string>(initialData.fromDayKey);
  const [to, setTo] = useState<string>(initialData.toDayKey);
  const [pending, setPending] = useState(false);

  async function applyFilter() {
    setPending(true);
    try {
      setData(await getArchiveDataAction(from as DayKey, to as DayKey));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col gap-6 bg-background px-6 py-12">
      <Link href="/" className="text-sm font-medium text-foreground/50 hover:text-foreground/80">
        ← Today
      </Link>

      <h1 className="text-2xl font-bold text-foreground">Archive</h1>

      {data.oneYearAgoEntry && (
        <div className="flex flex-col gap-2 rounded-3xl bg-surface p-5 shadow-sm ring-2 ring-foreground/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/40">One year ago today</p>
          <EntryCard
            dayKey={data.oneYearAgoEntry.dayKey}
            mood={data.oneYearAgoEntry.mood}
            text={data.oneYearAgoEntry.text}
          />
        </div>
      )}

      <div className="flex items-end gap-2 rounded-3xl bg-surface p-4 shadow-sm">
        <label className="flex flex-1 flex-col gap-1 text-xs text-foreground/50">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-foreground/50">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <button
          onClick={applyFilter}
          disabled={pending}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform active:scale-95 disabled:opacity-50"
        >
          Filter
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {data.entries.length === 0 ? (
          <p className="text-center text-sm text-foreground/40">No journal entries in this range.</p>
        ) : (
          data.entries.map((e) => <EntryCard key={e.dayKey} dayKey={e.dayKey} mood={e.mood} text={e.text} />)
        )}
      </div>

      <a
        href="/api/export"
        className="mx-auto text-xs font-medium text-foreground/40 underline decoration-dotted underline-offset-4 hover:text-foreground/60"
      >
        Export all data
      </a>
    </main>
  );
}
