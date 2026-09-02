"use client";

import { useEffect, useState } from "react";
import type { EveningData } from "@/app/actions/evening";
import type { DayKey } from "@/core/types";
import { HabitScoreRow } from "./HabitScoreRow";
import { JournalCard } from "./JournalCard";
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
};

/**
 * Phần dưới màn chính — SPEC.md §5.1 "Phần dưới — cuối ngày". Cuộn tới là gặp, không tách
 * màn hình riêng (§5.1: "Đừng tách theo giờ, đừng tự chuyển chế độ").
 */
export function EveningPanel({ todayKey, initialTodayData, liveTodaySummaryLine, onXpMightHaveChanged }: Props) {
  const { selectedDay, setSelectedDay, data, saveHabitScore, saveMood, saveJournal, close } = useEveningRitual({
    todayKey,
    initialTodayData,
    onXpMightHaveChanged,
  });
  const [justClosed, setJustClosed] = useState(false);
  const summaryLine = selectedDay === "today" ? liveTodaySummaryLine : (data?.summaryLine ?? "");

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

          <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground/60">Habits</h3>
            {data.habits.map((h) => (
              <HabitScoreRow key={h.id} habit={h} onChange={(score) => saveHabitScore(h.id, score)} />
            ))}
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

          <div className="relative">
            <NightSparkle active={justClosed} />
            <button
              onClick={handleClose}
              className="w-full rounded-full bg-foreground py-3 text-base font-bold text-background transition-transform active:scale-95"
            >
              {justClosed ? "Good night 🌙" : data.closedAt ? "Day closed ✓ — close again" : "Close day"}
            </button>
          </div>

          {/* Xuất dữ liệu thủ công (SPEC.md §5.5) — chỗ tạm cho tới khi có Cài đặt (mốc 8). */}
          <a
            href="/api/export"
            className="mx-auto text-xs font-medium text-foreground/40 underline decoration-dotted underline-offset-4 hover:text-foreground/60"
          >
            Export all data
          </a>
        </>
      )}
    </section>
  );
}
