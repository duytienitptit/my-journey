"use client";
import { useEffect, useState } from "react";
import { now } from "@/core/clock";
import { DEFAULT_DAILY_TASK_THRESHOLDS, HABIT_SCORE_MAX, HABIT_SCORE_MIN } from "@/core/balance";
import type { CheckInItem } from "@/app/actions/evening";
import { Icon } from "@/components/ui/Icon";

type Props = { habit: Extract<CheckInItem, { kind: "habit_score" }>; onChange: (score: number) => void };
export function HabitScoreRow({ habit, onChange }: Props) {
  const [currentMs, setCurrentMs] = useState(() => now());
  useEffect(() => {
    if (habit.bedtimeCutoff === undefined) return;
    const timer = window.setInterval(() => setCurrentMs(now()), 1000);
    return () => window.clearInterval(timer);
  }, [habit.bedtimeCutoff]);
  const style = { "--task-color": `var(--stat-${habit.stat})` } as React.CSSProperties;
  if (habit.bedtimeCutoff !== undefined) {
    const checked = (habit.score ?? 0) >= DEFAULT_DAILY_TASK_THRESHOLDS.sleepEnough;
    const locked = currentMs >= habit.bedtimeCutoff;
    return <div className="checkin-row bedtime-row" style={style}>
      <label><span className="checkin-name"><Icon name="bed"/><span>{habit.name}</span></span>
        <input type="checkbox" checked={checked} disabled={locked && !checked} onChange={(event) => onChange(event.target.checked ? DEFAULT_DAILY_TASK_THRESHOLDS.sleepEnough : HABIT_SCORE_MIN)}/>
      </label>
    </div>;
  }
  return <div className="checkin-row habit-score-row" style={style}>
    <span className="checkin-name"><Icon name={habit.stat}/><span>{habit.name}{habit.threshold !== null && habit.done ? " ✓" : ""}</span></span>
    <div className="habit-scores" role="group" aria-label={`${habit.name} score`}>
      {Array.from({ length: HABIT_SCORE_MAX - HABIT_SCORE_MIN + 1 }, (_, i) => HABIT_SCORE_MIN + i).map((score) =>
        <button key={score} onClick={() => onChange(score)} aria-pressed={habit.score === score} aria-label={`${habit.name} score ${score}`}>{score}</button>)}
    </div>
  </div>;
}
