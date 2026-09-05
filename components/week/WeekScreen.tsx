"use client";

import { useState } from "react";
import Link from "next/link";
import { getWeeklyReviewDataAction, saveWeekReviewAction, type WeeklyReviewData } from "@/app/actions/week";
import { NetWorthControl } from "@/components/assets/NetWorthControl";
import { StatBars } from "./StatBars";
import { MoodCurve } from "./MoodCurve";
import { WeekReviewCard } from "./WeekReviewCard";

/** "2026-08-03" → "Aug 3" — chỉ để HIỂN THỊ, không đi qua core/day.ts (không cần biết múi giờ,
 *  đã có sẵn năm/tháng/ngày trong chuỗi DayKey rồi). */
function formatDayKeyShort(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Nhìn lại tuần — SPEC.md §5.2, mốc 6. LUÔN tuần chứa hôm nay — không có màn duyệt tuần cũ
 * (đó là việc của Thư viện hành trình/Kho lưu trữ, §5.4-5.5, mốc 7). "Đọc được như một trang tạp
 * chí, không phải bảng số liệu" (luật nghiệm thu) — thẻ mềm, bo góc, không phải bảng kẻ ô.
 */
export function WeekScreen({ initialData }: { initialData: WeeklyReviewData }) {
  const [data, setData] = useState(initialData);

  async function refresh() {
    setData(await getWeeklyReviewDataAction());
  }

  async function handleSaveReview(text: string) {
    await saveWeekReviewAction(text);
    await refresh();
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col gap-6 bg-background px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-foreground/50 hover:text-foreground/80">
          ← Today
        </Link>
        <NetWorthControl netWorth={data.netWorth} hideMoney={data.hideMoney} onChanged={refresh} />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">This week</h1>
        <p className="text-sm text-foreground/50">
          {formatDayKeyShort(data.weekDays[0])} – {formatDayKeyShort(data.weekDays[6])}
        </p>
      </div>

      <div className="rounded-3xl bg-surface p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-foreground/60">Sessions by focus</h2>
        <StatBars countByStat={data.sessionCountByStat} />
      </div>

      {data.habitKeepRates.length > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground/60">Habits kept</h2>
          {data.habitKeepRates.map((h) => (
            <div key={h.habitId} className="flex items-center gap-3">
              <span className="text-lg">{h.emoji}</span>
              <span className="w-28 shrink-0 text-sm text-foreground/70">{h.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-foreground/60 transition-all"
                  style={{ width: `${h.rate * 100}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-foreground/50">
                {h.keptDays}/{h.consideredDays}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-3xl bg-surface p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-foreground/60">Mood</h2>
        <MoodCurve days={data.moodCurve} />
      </div>

      {data.totalSessions > 0 && (
        <p className="text-center text-sm text-foreground/60">
          {Math.round(data.backfillRate * 100)}% of this week&apos;s sessions were backfilled.
        </p>
      )}

      {/* Đúng MỘT câu hoặc không hiện gì — SPEC.md §5.2: "không đủ thì im lặng hoàn toàn". */}
      {data.correlationSentence && (
        <div className="rounded-3xl bg-surface p-5 text-center text-sm font-medium text-foreground shadow-sm">
          {data.correlationSentence}
        </div>
      )}

      {data.journalExcerpts.length > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground/60">From your journal</h2>
          {data.journalExcerpts.map((e) => (
            <blockquote
              key={e.dayKey}
              className="border-l-2 border-foreground/15 pl-3 text-sm italic text-foreground/70"
            >
              {e.excerpt}
            </blockquote>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground/60">Wrap up the week</h2>
        <WeekReviewCard value={data.reviewText} onSave={handleSaveReview} />
      </div>
    </main>
  );
}
