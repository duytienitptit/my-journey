"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { EveningData } from "@/app/actions/evening";
import type { WeeklyReviewData } from "@/app/actions/week";
import type { SaveState } from "@/components/useAutosave";
import { JOURNAL_MIN_WORDS } from "@/core/balance";
import { countJournalWords } from "@/core/journalCompose";
import type { DayKey } from "@/core/types";
import { HabitScoreRow } from "./HabitScoreRow";
import { JournalCard } from "./JournalCard";
import { LabelProgressRow } from "./LabelProgressRow";
import { Icon } from "@/components/ui/Icon";
import { MoodPicker } from "./MoodPicker";
import { NightSparkle } from "./NightSparkle";
import { useEveningRitual } from "./useEveningRitual";
import { SundayWrapUp } from "@/components/week/SundayWrapUp";

type Props = {
  todayKey: DayKey;
  todayData: EveningData;
  weeklyData: WeeklyReviewData | null;
  onTodayDataChange: Dispatch<SetStateAction<EveningData>>;
  /** Dòng "hôm nay tôi đã ở đâu" THẬT, tính trực tiếp từ đồng hồ pomodoro ở trên — xem
   *  DailyScreen.tsx để hiểu vì sao `data.summaryLine` (tự fetch riêng) không đủ. */
  liveTodaySummaryLine: string;
  onXpMightHaveChanged?: () => void;
  /** Truyền THẲNG `timer.backfill` từ DailyScreen — xem useEveningRitual.ts#quickAddSession. */
  onBackfillOneSession: (labelId: number) => Promise<boolean>;
  /** Truyền THẲNG `timer.undoBackfill` từ DailyScreen — xem useEveningRitual.ts#undoOneSession. */
  onUndoBackfillSession: (labelId: number) => Promise<boolean>;
};

/**
 * Phần dưới màn chính — SPEC.md §5.1 "Phần dưới — cuối ngày". Cuộn tới là gặp, không tách
 * màn hình riêng (§5.1: "Đừng tách theo giờ, đừng tự chuyển chế độ").
 */
export function EveningPanel({
  todayKey,
  todayData,
  weeklyData,
  onTodayDataChange,
  liveTodaySummaryLine,
  onXpMightHaveChanged,
  onBackfillOneSession,
  onUndoBackfillSession,
}: Props) {
  const {
    selectedDay,
    setSelectedDay,
    data,
    saveHabitScore,
    saveMood,
    saveJournal,
    quickAddSession,
    undoOneSession,
    close,
    pending,
    error,
  } = useEveningRitual({
    todayKey,
    todayData,
    onTodayDataChange,
    onXpMightHaveChanged,
    onBackfillOneSession,
    onUndoBackfillSession,
  });
  const [journalSaveState, setJournalSaveState] = useState<SaveState>("saved");
  const [justClosed, setJustClosed] = useState(false);
  const summaryLine = selectedDay === "today" ? liveTodaySummaryLine : (data?.summaryLine ?? "");
  // Chặn cứng "Close day" tới khi đủ JOURNAL_MIN_WORDS — [CHỐT — 2026-09-03], cố ý đi ngược
  // nguyên tắc 3 (§2 "dữ liệu chảy vào không bị bơm vào"), chủ dự án đã xác nhận muốn vậy. Đếm
  // trên TOÀN BỘ journalText đã gộp (câu hỏi quan trọng + câu gợi ý), không chỉ ô tự do.
  const journalWordCount = countJournalWords(data?.journalText ?? "");
  const journalWordsMet = journalWordCount >= JOURNAL_MIN_WORDS;

  useEffect(() => {
    if (!justClosed) return;
    const t = window.setTimeout(() => setJustClosed(false), 3000);
    return () => window.clearTimeout(t);
  }, [justClosed]);

  async function handleClose() {
    if (await close()) setJustClosed(true);
  }

  function jumpToWeek() {
    const target = document.getElementById("week-wrap-up");
    const panel = target?.closest(".today-panel");
    if (target && panel) panel.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  }

  const tasks = data?.checkIn.filter((item) => item.kind !== "habit_score" || item.threshold !== null) ?? [];
  return (
    <section id="evening" className="evening-panel" aria-labelledby="check-in-heading">
      <div className="checkin-heading">
        <div><h1 id="check-in-heading">Daily check-in</h1><p className="checkin-subtitle">A moment to reflect.</p><p className="checkin-summary">{summaryLine}</p></div>
        <div className="day-selector" role="group" aria-label="Check-in day">
          {([{ key: "today", label: "Today" }, { key: "yesterday", label: "Yesterday" }] as const).map((day) =>
            <button key={day.key} aria-pressed={selectedDay === day.key} onClick={() => setSelectedDay(day.key)}>{day.label}</button>)}
        </div>
      </div>
      {weeklyData && <p className="sunday-checkin-note"><span>Sunday</span> Your weekly reflection is ready below today’s check-in. <button type="button" onClick={jumpToWeek}>Jump to week ↓</button></p>}
      {error && <p role="alert" className="checkin-error">{error}</p>}
      {!data ? <p role="status">Loading…</p> : <div className="checkin-columns">
        <div className="checkin-progress">
          <h2>{selectedDay === "today" ? "Today’s progress" : "Yesterday’s progress"}</h2>
          <p className="checkin-caption">{tasks.filter((item) => item.done).length} of {tasks.length} daily goals complete</p>
          <fieldset disabled={pending} className="checkin-items">
            <legend className="sr-only">Daily tasks and habits</legend>
            {data.checkIn.map((item) => {
              if (item.kind === "label") return <LabelProgressRow key={`label-${item.labelId}`} item={item} showButtons={selectedDay === "today"}
                onAdd={() => quickAddSession(item.labelId)} onRemove={() => undoOneSession(item.labelId)}/>;
              if (item.kind === "journal_status") return <div key="journal-status" className="checkin-row journal-status" style={{ "--task-color": `var(--stat-${item.stat})` } as React.CSSProperties}>
                <span className="checkin-name"><Icon name="book"/><span>{item.name}</span></span>
                <span>{item.done ? "Written ✓" : "Not yet"}</span>
              </div>;
              return <HabitScoreRow key={`habit-${item.habitId}`} habit={item} onChange={(score) => saveHabitScore(item.habitId, score)}/>;
            })}
          </fieldset>
          <div className="mood-row"><h2>Mood</h2><fieldset disabled={pending}><legend className="sr-only">Your mood</legend><MoodPicker value={data.mood} onChange={saveMood}/></fieldset></div>
        </div>
        <div className="checkin-journal" data-no-swipe>
          <div className="journal-heading"><h2><Icon name="leaf" size={26}/>Journal</h2><span>{journalWordCount} / {JOURNAL_MIN_WORDS} words</span></div>
          <JournalCard key={data.dayKey} dayKey={data.dayKey} onSaveStateChange={setJournalSaveState} prompt={data.journalPrompt} value={data.journalText} onSave={saveJournal}/>
          <div className="close-day-row">
            <NightSparkle active={justClosed}/>
            <p>{!journalWordsMet ? "Write a little more to close your day." : journalSaveState !== "saved" ? "Your journal needs to be saved first." : "A little growth, one day at a time."}</p>
            <button onClick={handleClose} disabled={!journalWordsMet || pending || journalSaveState !== "saved"} className="close-day">
              {pending ? "Saving…" : justClosed ? "Good night 🌙" : data.closedAt ? "Day closed ✓ — close again" : "Close day"}
            </button>
          </div>
        </div>
      </div>}
      {weeklyData && <SundayWrapUp data={weeklyData}/>}
    </section>
  );
}
