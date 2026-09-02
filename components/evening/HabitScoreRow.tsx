"use client";

import { HABIT_SCORE_MAX, HABIT_SCORE_MIN } from "@/core/balance";
import type { EveningHabitView } from "@/app/actions/evening";

type Props = {
  habit: EveningHabitView;
  onChange: (score: number) => void;
};

/** Sport, Sleep enough — tự chấm 1-5, không phải tích Có/Không (SPEC.md §4.2). */
export function HabitScoreRow({ habit, onChange }: Props) {
  const scores = Array.from(
    { length: HABIT_SCORE_MAX - HABIT_SCORE_MIN + 1 },
    (_, i) => HABIT_SCORE_MIN + i,
  );

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-foreground/80">
        {habit.emoji} {habit.name}
      </span>
      <div className="flex gap-1">
        {scores.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            aria-label={`${habit.name} score ${s}`}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all active:scale-90 ${
              habit.score === s
                ? "bg-foreground text-background"
                : "bg-surface-muted text-foreground/60 hover:bg-surface-muted/70"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
