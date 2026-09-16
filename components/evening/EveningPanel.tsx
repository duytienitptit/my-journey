"use client";

import { useEffect, useState } from "react";
import type { EveningData } from "@/app/actions/evening";
import { JOURNAL_MIN_WORDS } from "@/core/balance";
import { countWords } from "@/core/journalCompose";
import type { DayKey } from "@/core/types";
import { HabitScoreRow } from "./HabitScoreRow";
import { JournalCard } from "./JournalCard";
import { LabelProgressRow } from "./LabelProgressRow";
import { MoodPicker } from "./MoodPicker";
import { NightSparkle } from "./NightSparkle";
import { useEveningRitual } from "./useEveningRitual";

type Props = {
  todayKey: DayKey;
  initialTodayData: EveningData;
  /** Dòng "hôm nay tôi đã ở đâu" THẬT, tính trực tiếp từ đồng hồ pomodoro ở trên — xem
   *  DailyScreen.tsx để hiểu vì sao `data.summaryLine` (tự fetch riêng) không đủ. */
  liveTodaySummaryLine: string;
  onXpMightHaveChanged?: () => void;
  /** Truyền THẲNG `timer.backfill` từ DailyScreen — xem useEveningRitual.ts#quickAddSession. */
  onBackfillOneSession: (labelId: number) => void;
  /** Truyền THẲNG `timer.undoBackfill` từ DailyScreen — xem useEveningRitual.ts#undoOneSession. */
  onUndoBackfillSession: (labelId: number) => void;
};

/**
 * Phần dưới màn chính — SPEC.md §5.1 "Phần dưới — cuối ngày". Cuộn tới là gặp, không tách
 * màn hình riêng (§5.1: "Đừng tách theo giờ, đừng tự chuyển chế độ").
 */
export function EveningPanel({
  todayKey,
  initialTodayData,
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
  } = useEveningRitual({
    todayKey,
    initialTodayData,
    onXpMightHaveChanged,
    onBackfillOneSession,
    onUndoBackfillSession,
  });
  const [justClosed, setJustClosed] = useState(false);
  const summaryLine = selectedDay === "today" ? liveTodaySummaryLine : (data?.summaryLine ?? "");
  // Chặn cứng "Close day" tới khi đủ JOURNAL_MIN_WORDS — [CHỐT — 2026-09-03], cố ý đi ngược
  // nguyên tắc 3 (§2 "dữ liệu chảy vào không bị bơm vào"), chủ dự án đã xác nhận muốn vậy. Đếm
  // trên TOÀN BỘ journalText đã gộp (câu hỏi quan trọng + câu gợi ý), không chỉ ô tự do.
  const journalWordCount = countWords(data?.journalText ?? "");
  const journalWordsMet = journalWordCount >= JOURNAL_MIN_WORDS;

  useEffect(() => {
    if (!justClosed) return;
    const t = window.setTimeout(() => setJustClosed(false), 3000);
    return () => window.clearTimeout(t);
  }, [justClosed]);

  function handleClose() {
    close();
    setJustClosed(true);
  }

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Evening</h2>
        <div className="flex rounded-full bg-surface-muted p-1 text-sm font-medium">
          {(
            [
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
            ] as const
          ).map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`rounded-full px-3 py-1 transition-colors ${
                selectedDay === d.key ? "bg-surface text-foreground shadow-sm" : "text-foreground/50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <p className="text-sm text-foreground/50">Loading…</p>
      ) : (
        <>
          <p className="text-sm text-foreground/70">{summaryLine}</p>

          {/* "Check-in" — [MỚI, 2026-09-16] gộp cả nhãn có ngưỡng phiên (English/Deep work/New
              knowledge) lẫn thói quen chấm điểm (Sport/Sleep) và trạng thái nhật ký vào MỘT
              danh sách, theo đúng thứ tự đã cấu hình "6 việc" (§4.5) ở Cài đặt — trước đây khối
              này (tên cũ "Habits") chỉ có hai thói quen, không có chỗ nào hiện số phiên đã làm
              cho ba nhãn kia. */}
          <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground/60">Check-in</h3>
            {data.checkIn.map((item) => {
              if (item.kind === "label") {
                return (
                  <LabelProgressRow
                    key={`label-${item.labelId}`}
                    item={item}
                    showButtons={selectedDay === "today"}
                    onAdd={() => quickAddSession(item.labelId)}
                    onRemove={() => undoOneSession(item.labelId)}
                  />
                );
              }
              if (item.kind === "journal_status") {
                return (
                  <div key="journal-status" className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground/80">
                      {item.emoji} {item.name}
                    </span>
                    <span className="text-sm text-foreground/60">{item.done ? "Written ✓" : "Not yet"}</span>
                  </div>
                );
              }
              return (
                <HabitScoreRow
                  key={`habit-${item.habitId}`}
                  habit={item}
                  onChange={(score) => saveHabitScore(item.habitId, score)}
                />
              );
            })}
          </div>

          <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground/60">Mood</h3>
            <MoodPicker value={data.mood} onChange={saveMood} />
          </div>

          <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground/60">Journal</h3>
            <JournalCard
              key={data.dayKey}
              prompt={data.journalPrompt}
              value={data.journalText}
              onSave={saveJournal}
            />
          </div>

          <div className="relative flex flex-col items-center gap-2">
            <NightSparkle active={justClosed} />
            <button
              onClick={handleClose}
              disabled={!journalWordsMet}
              className="w-full rounded-full bg-foreground py-3 text-base font-bold text-background transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
            >
              {justClosed ? "Good night 🌙" : data.closedAt ? "Day closed ✓ — close again" : "Close day"}
            </button>
            {!journalWordsMet && (
              <p className="text-xs font-medium text-foreground/45">
                {journalWordCount}/{JOURNAL_MIN_WORDS} words in journal — write a bit more to close the day
              </p>
            )}
          </div>

        </>
      )}
    </section>
  );
}
