import { MOOD_MAX, MOOD_MIN } from "@/core/balance";
import { MOOD_EMOJI } from "@/components/evening/MoodPicker";
import { isoWeekdayOf } from "@/core/day";
import type { DayKey } from "@/core/types";

const WEEKDAY_LETTER: Record<number, string> = { 1: "M", 2: "T", 3: "W", 4: "T", 5: "F", 6: "S", 7: "S" };

const WIDTH = 280;
const HEIGHT = 90;
const PAD_X = 18;
const PAD_Y = 16;

function yForMood(mood: number): number {
  const range = MOOD_MAX - MOOD_MIN;
  return PAD_Y + ((MOOD_MAX - mood) / range) * (HEIGHT - PAD_Y * 2);
}

function xForIndex(i: number): number {
  return PAD_X + (i / 6) * (WIDTH - PAD_X * 2);
}

/** Đường cong tâm trạng theo ngày — SPEC.md §5.2. Ngày chưa chấm để trống, KHÔNG nối qua nó. */
export function MoodCurve({ days }: { days: readonly { dayKey: DayKey; mood: number | null }[] }) {
  const segments: string[] = [];
  let current: string[] = [];
  days.forEach((d, i) => {
    if (d.mood === null) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
      return;
    }
    current.push(`${xForIndex(i)},${yForMood(d.mood)}`);
  });
  if (current.length > 1) segments.push(current.join(" "));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + 20}`} className="w-full">
      {segments.map((points, i) => (
        <polyline key={i} points={points} fill="none" stroke="currentColor" strokeWidth={2} className="text-foreground/25" />
      ))}
      {days.map((d, i) => (
        <text
          key={d.dayKey}
          x={xForIndex(i)}
          y={d.mood === null ? HEIGHT / 2 + PAD_Y / 2 : yForMood(d.mood)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={d.mood === null ? 10 : 16}
          className={d.mood === null ? "fill-foreground/25" : ""}
        >
          {d.mood === null ? "·" : MOOD_EMOJI[d.mood]}
        </text>
      ))}
      {days.map((d, i) => (
        <text
          key={`${d.dayKey}-label`}
          x={xForIndex(i)}
          y={HEIGHT + 12}
          textAnchor="middle"
          fontSize={10}
          className="fill-foreground/40"
        >
          {WEEKDAY_LETTER[isoWeekdayOf(d.dayKey)]}
        </text>
      ))}
    </svg>
  );
}
