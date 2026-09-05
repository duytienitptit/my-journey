"use client";

import { MOOD_MAX, MOOD_MIN } from "@/core/balance";

// [CHỐT — 2026-09-03] Kéo giãn cả hai đầu so với bộ cũ (😞😕😐🙂😄) — mức 1 khóc rõ hơn, mức 5
// cười toe hơn, 5 mức dễ phân biệt hơn khi liếc nhanh. Xem SPEC.md §5.1.
export const MOOD_EMOJI: Record<number, string> = { 1: "😢", 2: "🙁", 3: "😐", 4: "🙂", 5: "😁" };

type Props = {
  value: number | null;
  onChange: (mood: number) => void;
};

/** Một tâm trạng cho cả ngày, một cú bấm — 5 mức 1-5 (SPEC.md §5.1, §11.2 câu Q18). */
export function MoodPicker({ value, onChange }: Props) {
  const moods = Array.from({ length: MOOD_MAX - MOOD_MIN + 1 }, (_, i) => MOOD_MIN + i);
  return (
    <div className="flex gap-2">
      {moods.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-label={`Mood ${m}`}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl transition-all active:scale-90 ${
            value === m ? "bg-foreground/10 ring-2 ring-foreground/40" : "hover:bg-surface-muted"
          }`}
        >
          {MOOD_EMOJI[m]}
        </button>
      ))}
    </div>
  );
}
