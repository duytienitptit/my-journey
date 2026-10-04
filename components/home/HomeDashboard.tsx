"use client";

import type { ReactNode } from "react";
import { GroveScene } from "@/components/forest/GroveScene";
import { Icon } from "@/components/ui/Icon";
import type { CheckInItem } from "@/app/actions/evening";
import type { DayAchievedStreakInfo } from "@/core/engine/types";
import type { StatKey } from "@/core/types";
import type { SessionForDay } from "@/db/queries";

export function SessionSummary({ sessions }: { sessions: readonly SessionForDay[] }) {
  const completed = sessions.filter((session) => session.status === "completed");
  const counts = new Map<number, { name: string; count: number }>();
  for (const session of completed) {
    const entry = counts.get(session.labelId) ?? { name: session.labelName, count: 0 };
    entry.count++;
    counts.set(session.labelId, entry);
  }
  return <div className="session-summary">
    <p className="session-total"><strong>{completed.length}</strong> {completed.length === 1 ? "session" : "sessions"} today</p>
    <p className="session-breakdown">{counts.size ? [...counts.values()].map(({ name, count }) => `${name} ${count}`).join(" · ") : "Your next session starts a little growth."}</p>
  </div>;
}

type Props = {
  levelByStat: Record<StatKey, number>;
  xpByStat: Record<StatKey, number>;
  neglectDangerByStat: Record<StatKey, boolean>;
  dayAchievedStreak: DayAchievedStreakInfo;
  chapter: number;
  checkIn: readonly CheckInItem[];
  sessions: readonly SessionForDay[];
  children: ReactNode;
  visible: boolean;
  onWrapWeek?: () => void;
};

export function HomeDashboard({ levelByStat, xpByStat, neglectDangerByStat, dayAchievedStreak, chapter, checkIn, sessions, children, visible, onWrapWeek }: Props) {
  const tasks = checkIn.filter((item) => item.kind !== "habit_score" || item.threshold !== null);
  return <section className="home-dashboard" aria-label="Your day and growing grove">
    <div className="today-content">
      <p className="chapter-eyebrow">Chapter {chapter}
        {dayAchievedStreak.current > 0 && <span className={dayAchievedStreak.danger ? "streak is-in-danger" : "streak"} title={`Longest streak: ${dayAchievedStreak.longest} days`}>✦ {dayAchievedStreak.current} day streak</span>}
      </p>
      <h1>A little growth,<br/>{" "}every day.</h1>
      <SessionSummary sessions={sessions}/>
      {onWrapWeek && <button type="button" className="sunday-invitation" onClick={onWrapWeek}>Sunday reflection <span>Wrap up your week →</span></button>}
      <div className="daily-overview">
        <p>{tasks.filter((item) => item.done).length} of {tasks.length} daily goals complete</p>
        <ul className="daily-goals">
          {tasks.map((item, index) => <li key={index} style={{ "--task-color": `var(--stat-${item.stat})` } as React.CSSProperties}>
            <span className={`goal-check ${item.done ? "is-done" : ""}`} aria-label={item.done ? "Complete" : "Incomplete"}>{item.done && <Icon name="check" size={16}/>}</span>
            <span className="goal-name">{item.name}</span>
            <span className="goal-count">{item.kind === "label" ? `${item.count} / ${item.threshold}` : item.done ? "Done" : "—"}</span>
          </li>)}
        </ul>
      </div>
      {children}
    </div>
    <GroveScene levels={levelByStat} xp={xpByStat} neglect={neglectDangerByStat} danger={dayAchievedStreak.danger} streak={dayAchievedStreak.current} visible={visible}/>
  </section>;
}
