"use client";

import { DAILY_SESSION_GOAL_DEFAULT } from "@/core/balance";
import type { StatKey } from "@/core/types";
import { BackfillButton } from "./BackfillButton";
import { CircularProgress } from "./CircularProgress";
import { Confetti } from "./Confetti";
import { secondsRemaining, type useSessionTimer } from "./useSessionTimer";

export type TimerLabel = { id: number; name: string; emoji: string; color: string; stat: StatKey };

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Nhận state từ useSessionTimer() qua props thay vì tự gọi hook — DailyScreen là nơi DUY NHẤT
// gọi useSessionTimer(), vì RoomScene cũng cần đọc "pose" từ cùng một trạng thái đó. Gọi hook
// ở cả hai nơi sẽ tạo hai bản sao độc lập cùng ghi/đọc một phiên trong DB — dễ lệch nhau.
type Props = ReturnType<typeof useSessionTimer> & { labels: readonly TimerLabel[] };

export function TimerOverlay({
  labels,
  selectedLabelId,
  setSelectedLabelId,
  running,
  nowMs,
  todaySessions,
  justCompletedLabelId,
  pending,
  start,
  abandon,
  backfill,
}: Props) {
  const activeLabel = labels.find((l) => l.id === (running?.labelId ?? selectedLabelId)) ?? labels[0];
  const goalProgress = todaySessions.length / DAILY_SESSION_GOAL_DEFAULT;

  return (
    <>
      {/* Góc trên trái — duy nhất một chỗ được hiện thống kê ban ngày (SPEC.md §5.1): dải chấm
          phiên hôm nay. Chuỗi ngày hiện tại chờ mốc 4 (cần lịch sử nhiều ngày). */}
      <div className="pointer-events-auto absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-2 shadow-md backdrop-blur">
        {todaySessions.length === 0 ? (
          <span className="px-1 text-sm text-foreground/50">No sessions yet today</span>
        ) : (
          todaySessions.map((s) => {
            const label = labels.find((l) => l.id === s.labelId);
            const isBackfilled = s.source === "manual";
            return (
              <span
                key={s.id}
                title={`${label?.name ?? s.labelId}${isBackfilled ? " · backfilled" : ""}${s.status === "abandoned" ? " · abandoned" : ""}`}
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: label?.color ?? "#999",
                  opacity: s.status === "abandoned" ? 0.25 : isBackfilled ? 0.55 : 1,
                }}
              />
            );
          })
        )}
      </div>

      {/* Góc trên phải — ghi bù. */}
      <div className="pointer-events-auto absolute right-4 top-4">
        <BackfillButton labels={labels} onBackfill={backfill} />
      </div>

      {/* Giữa dưới — đồng hồ. Trạng thái tĩnh khi chạy: chỉ số phút, tên nhãn, gần như trống. */}
      <div className="pointer-events-auto absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
        {running ? (
          <>
            <CircularProgress
              progress={goalProgress}
              color={activeLabel.color}
              size={200}
              strokeWidth={7}
            >
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {formatClock(secondsRemaining(running, nowMs))}
                </span>
                <span className="mt-1 text-sm font-medium text-foreground/60">
                  {activeLabel.emoji} {activeLabel.name}
                </span>
              </div>
            </CircularProgress>
            <button
              onClick={abandon}
              className="text-sm font-medium text-foreground/45 underline decoration-dotted underline-offset-4 hover:text-foreground/70"
            >
              Abandon
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface/90 p-5 shadow-lg backdrop-blur">
            <div className="flex gap-2">
              {labels.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLabelId(l.id)}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-all active:scale-95 ${
                    selectedLabelId === l.id ? "text-background shadow-sm" : "bg-surface-muted text-foreground/70"
                  }`}
                  style={selectedLabelId === l.id ? { backgroundColor: l.color } : undefined}
                >
                  {l.emoji} {l.name}
                </button>
              ))}
            </div>
            <button
              onClick={start}
              disabled={pending}
              className="rounded-full bg-foreground px-8 py-2.5 text-base font-bold text-background transition-transform active:scale-95 disabled:opacity-50"
            >
              Start
            </button>
          </div>
        )}
      </div>

      {/* Khoảnh khắc hoàn thành — chuông đã kêu trong hook, ở đây chỉ còn pháo giấy + một câu
          nhẹ nhàng, không hỏi han gì (SPEC.md §4.3: "đừng hỏi tôi gì cả lúc đó"). */}
      <div className="pointer-events-none absolute bottom-40 left-1/2 -translate-x-1/2">
        <Confetti active={justCompletedLabelId !== null} />
      </div>
      {justCompletedLabelId !== null && (
        <div className="absolute bottom-56 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-foreground shadow-lg">
          Nice — take a break 🌿
        </div>
      )}
    </>
  );
}
