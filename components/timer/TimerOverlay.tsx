"use client";

import { DAILY_SESSION_GOAL_DEFAULT } from "@/core/balance";
import type { DayAchievedStreakInfo } from "@/core/engine/types";
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
type Props = ReturnType<typeof useSessionTimer> & {
  labels: readonly TimerLabel[];
  /** Chuỗi ngày-đạt, TỚI HẾT HÔM QUA (§4.6/R5) — mốc 4. */
  dayAchievedStreak: DayAchievedStreakInfo;
};

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
  dayAchievedStreak,
}: Props) {
  const activeLabel = labels.find((l) => l.id === (running?.labelId ?? selectedLabelId)) ?? labels[0];
  const goalProgress = todaySessions.length / DAILY_SESSION_GOAL_DEFAULT;

  return (
    <>
      {/* Góc trên trái/phải — chỉ hiện lúc TĨNH (chưa bấm Start). SPEC.md §5.1 "chế độ tập
          trung": lúc đồng hồ chạy, đây cũng phải trống — không chỉ nhường chỗ mà ẩn hẳn, đúng
          nguyên tắc 1 (§2) "tĩnh ở chỗ tập trung". */}
      {!running && (
        <>
          {/* Duy nhất một chỗ được hiện thống kê ban ngày (§5.1): chuỗi ngày-đạt + dải chấm
              phiên hôm nay. Chuỗi chỉ hiện SỐ (🔥 + con số), không kèm chữ nào — mốc 4 chưa có
              câu chữ "trách móc" nào được duyệt (§4.12/R3), nên chỗ này cố ý không cần chữ để
              không phải chờ duyệt. Chỉ hiện khi current > 0 — chuỗi 0 để im lặng, không có số
              0 nào đập vào mắt lúc mới gãy hoặc chưa từng có. Số dài nhất xem qua title (hover).
              `danger` (ân hạn 1 ngày, [CHỐT — 2026-09-04]) đổi màu cam cảnh báo — CHỈ đổi màu,
              không thêm chữ, đúng ý chủ dự án đã chọn khi hỏi. */}
          <div className="pointer-events-auto absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-2 shadow-md backdrop-blur">
            {dayAchievedStreak.current > 0 && (
              <>
                <span
                  className={`flex items-center gap-0.5 px-1 text-sm font-semibold ${
                    dayAchievedStreak.danger ? "text-amber-600" : "text-foreground/70"
                  }`}
                  title={
                    dayAchievedStreak.danger
                      ? `Missed yesterday — save it today or it's gone. Longest: ${dayAchievedStreak.longest}`
                      : `Longest day-streak: ${dayAchievedStreak.longest}`
                  }
                >
                  🔥{dayAchievedStreak.current}
                </span>
                <span className="h-4 w-px bg-foreground/15" />
              </>
            )}
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

          <div className="pointer-events-auto absolute right-4 top-4">
            <BackfillButton labels={labels} onBackfill={backfill} />
          </div>
        </>
      )}

      {running ? (
        // Chế độ tập trung (SPEC.md §5.1, [CHỐT — 2026-09-03]) — phủ kín màn hình, đứng giữa
        // thay vì nổi ở góc dưới, phòng đã tối gần như đen (RoomScene focusMode) nên chữ đổi
        // sang màu sáng thay vì `text-foreground` (vốn tính cho nền sáng, chìm mất trên nền tối).
        <div className="pointer-events-auto fixed inset-0 flex flex-col items-center justify-center gap-6">
          <CircularProgress
            progress={goalProgress}
            color={activeLabel.color}
            size={340}
            strokeWidth={8}
            trackColor="rgba(255,255,255,0.12)"
          >
            <div className="flex flex-col items-center">
              <span className="text-7xl font-bold tabular-nums text-white">
                {formatClock(secondsRemaining(running, nowMs))}
              </span>
              <span className="mt-2 text-lg font-medium text-white/60">
                {activeLabel.emoji} {activeLabel.name}
              </span>
            </div>
          </CircularProgress>
          <button
            onClick={abandon}
            className="text-sm font-medium text-white/40 underline decoration-dotted underline-offset-4 hover:text-white/70"
          >
            Abandon
          </button>
        </div>
      ) : (
        <div className="pointer-events-auto absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
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
        </div>
      )}

      {/* Khoảnh khắc hoàn thành — chuông đã kêu trong hook, ở đây chỉ còn pháo giấy + một câu
          nhẹ nhàng, không hỏi han gì (SPEC.md §4.3: "đừng hỏi tôi gì cả lúc đó"). Phòng đã bắt
          đầu sáng lại (focusMode tắt ngay khi running về null) lúc mảnh này hiện ra, nên vẫn
          dùng màu chữ/nền cho nền sáng như cũ, không cần đổi theo focus mode. */}
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
