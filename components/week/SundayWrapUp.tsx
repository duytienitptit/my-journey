"use client";

import { useState } from "react";
import Link from "next/link";
import { saveWeekReviewAction, type WeeklyReviewData } from "@/app/actions/week";
import { STAT_KEYS, type StatKey } from "@/core/types";
import { Icon } from "@/components/ui/Icon";
import { MoodCurve } from "./MoodCurve";
import { WeekReviewCard } from "./WeekReviewCard";

const STAT_NAME: Record<StatKey, string> = { mind: "Mind", health: "Health", spirit: "Spirit" };

/** Sunday's weekly ritual lives beside the daily check-in; the /week page remains available. */
export function SundayWrapUp({ data }: { data: WeeklyReviewData }) {
  const [reviewText, setReviewText] = useState(data.reviewText);
  const maxSessions = Math.max(1, ...STAT_KEYS.map((stat) => data.sessionCountByStat[stat]));

  async function saveReview(text: string) {
    await saveWeekReviewAction(text);
    setReviewText(text);
  }

  return <section id="week-wrap-up" className="sunday-wrapup" aria-labelledby="week-wrapup-title">
    <div className="sunday-wrapup-heading">
      <div><p className="sunday-eyebrow">Sunday · Weekly reflection</p><h2 id="week-wrapup-title">Wrap up your week.</h2>
        <p>{data.totalSessions} completed {data.totalSessions === 1 ? "session" : "sessions"} this week. Take a moment to see what grew.</p></div>
      <Link href="/week">Open full week ↗</Link>
    </div>
    <div className="sunday-wrapup-columns">
      <div className="sunday-week-recap">
        <h3>Growth by focus</h3>
        <div className="sunday-stat-list">{STAT_KEYS.map((stat) => <div key={stat} style={{ "--task-color": `var(--stat-${stat})` } as React.CSSProperties}>
          <span><Icon name={stat} size={20}/>{STAT_NAME[stat]}</span><div className="sunday-stat-track"><span style={{ width: `${data.sessionCountByStat[stat] / maxSessions * 100}%` }}/></div><strong>{data.sessionCountByStat[stat]}</strong>
        </div>)}</div>
        <h3>Mood through the week</h3><MoodCurve days={data.moodCurve}/>
        {data.habitKeepRates.length > 0 && <><h3>Habits kept</h3><ul className="sunday-habits">{data.habitKeepRates.map((habit) => <li key={habit.habitId}><span>{habit.emoji} {habit.name}</span><span>{habit.keptDays}/{habit.consideredDays} days</span></li>)}</ul></>}
        {data.correlationSentence && <p className="sunday-insight">{data.correlationSentence}</p>}
        {data.journalExcerpts.length > 0 && <><h3>From your journal</h3><blockquote className="sunday-excerpt">{data.journalExcerpts[0].excerpt}</blockquote></>}
      </div>
      <div className="sunday-week-writing" data-no-swipe>
        <h3>Your weekly reflection</h3>
        <p>Answer what helps, or use the open space below.</p>
        <WeekReviewCard weekStart={data.weekStart} value={reviewText} onSave={saveReview} embedded/>
      </div>
    </div>
  </section>;
}
