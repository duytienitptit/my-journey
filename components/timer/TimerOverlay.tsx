"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { Fireflies } from "@/components/forest/Fireflies";
import type { StatKey } from "@/core/types";
import { BackfillButton } from "./BackfillButton";
import { CircularProgress } from "./CircularProgress";
import { Confetti } from "./Confetti";
import { secondsRemaining, type useSessionTimer } from "./useSessionTimer";

export type TimerLabel = { id: number; name: string; emoji: string; color: string; stat: StatKey };
type TimerState = ReturnType<typeof useSessionTimer>;

export function TimerOverlay({ timer, labels, active }: { timer: TimerState; labels: readonly TimerLabel[]; active: boolean }) {
  const { running, pending, start, setSelectedLabelId, selectedLabelId, backfill, justCompletedLabelId } = timer;
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!active || running || event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, button, a, [contenteditable], [role=dialog]")) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (!pending && labels.length) void start();
      } else if (/^[1-9]$/.test(event.key) && Number(event.key) <= labels.length) {
        setSelectedLabelId(labels[Number(event.key) - 1].id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, running, pending, labels, start, setSelectedLabelId]);

  return <div className="focus-controls" data-no-swipe>
    <h2>What will you focus on?</h2>
    <div className="focus-labels" role="group" aria-label="Session label">
      {labels.map((label) => <button key={label.id} type="button" aria-pressed={selectedLabelId === label.id} onClick={() => setSelectedLabelId(label.id)}
        style={{ "--task-color": `var(--stat-${label.stat})` } as React.CSSProperties}>
        <Icon name={label.stat} size={22}/><span>{label.name}</span>
      </button>)}
    </div>
    <button className="start-focus" onClick={() => void start()} disabled={pending || !labels.length || running !== null}><Icon name="play" size={18}/>{pending ? "Starting…" : "Start focus"}</button>
    {!labels.length && <p className="empty-labels">Add a label in Settings to start your first session.</p>}
    <div className="backfill-anchor"><BackfillButton labels={labels} onBackfill={backfill}/></div>
    <Confetti active={justCompletedLabelId !== null}/>
    {justCompletedLabelId !== null && <p role="status" className="session-complete">Nice — take a break 🌿</p>}
  </div>;
}

export function FocusSession({ timer, labels }: { timer: TimerState; labels: readonly TimerLabel[] }) {
  const { running, nowMs, abandon, pending } = timer;
  if (!running) return null;
  const label = labels.find((item) => item.id === running.labelId);
  const remaining = secondsRemaining(running, nowMs);
  const progress = 1 - remaining / Math.max(1, (running.endsAt - running.startedAt) / 1000);
  return <section className="focus-session" role="dialog" aria-modal="true" aria-label="Focus session">
    <Fireflies visible/>
    <p className="focus-eyebrow">A little time, just for this.</p>
    <div className="focus-clock">
      <CircularProgress progress={progress} color={`var(--stat-${label?.stat ?? "mind"})`} size={400} strokeWidth={4} trackColor="rgba(255,255,255,.1)">
        <div className="clock-content">
          <span className="clock-digits" role="timer" aria-label="Time remaining">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>
          <span className="clock-label">{label?.name ?? "Focus"}</span>
        </div>
      </CircularProgress>
    </div>
    <button autoFocus onClick={() => void abandon()} disabled={pending} className="abandon-focus">Abandon session</button>
  </section>;
}
