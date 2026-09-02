"use client";

import { useEffect, useRef, useState } from "react";
import { EveningPanel } from "@/components/evening/EveningPanel";
import { RoomScene, type TimeOfDay } from "@/components/room/RoomScene";
import type { CharacterPose } from "@/components/room/Character";
import { TimerOverlay, type TimerLabel } from "@/components/timer/TimerOverlay";
import { useSessionTimer } from "@/components/timer/useSessionTimer";
import type { ActiveSession } from "@/components/timer/useSessionTimer";
import type { EveningData } from "@/app/actions/evening";
import type { SessionForDay } from "@/db/queries";
import type { DayKey } from "@/core/types";

type Props = {
  labels: readonly TimerLabel[];
  todayKey: DayKey;
  initialActiveSession: ActiveSession | null;
  initialTodaySessions: SessionForDay[];
  initialSummaryLine: string;
  initialEveningData: EveningData;
};

/**
 * Màn hình chính — SPEC.md §5.1. Gộp "Làm việc" và "Nghi thức tối" làm một, cuộn tới là gặp
 * (không tách theo giờ, không tự chuyển chế độ). Phòng 3D cố định toàn màn hình phía sau;
 * đồng hồ nổi ở trên trong khung nhìn đầu; nghi thức tối cuộn lên từ dưới.
 */
export function DailyScreen({
  labels,
  todayKey,
  initialActiveSession,
  initialTodaySessions,
  initialSummaryLine,
  initialEveningData,
}: Props) {
  const timer = useSessionTimer({
    initialActiveSession,
    initialTodaySessions,
    initialSummaryLine,
    defaultLabelId: labels[0]?.id ?? 0,
  });

  const activeLabel = labels.find((l) => l.id === timer.running?.labelId);
  const pose: CharacterPose = timer.running ? (activeLabel?.stat ?? "idle") : "idle";

  const eveningMarkerRef = useRef<HTMLDivElement | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");

  useEffect(() => {
    const el = eveningMarkerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTimeOfDay(entry.isIntersecting ? "evening" : "day"),
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      {/* Phòng 3D — cố định phủ toàn màn hình phía sau nội dung cuộn (SPEC.md §5.1: "căn phòng
          3D chiếm phần lớn màn hình"). */}
      <div className="fixed inset-0 -z-10">
        <RoomScene pose={pose} timeOfDay={timeOfDay} />
      </div>

      {/* Khung nhìn đầu — cao đúng một màn hình, đồng hồ nổi ở đây. */}
      <div className="relative h-svh w-full">
        <TimerOverlay {...timer} labels={labels} />
      </div>

      {/* Nghi thức tối — cuộn tới là gặp. `timer.summaryLine` truyền xuống làm nguồn THẬT cho
          dòng "hôm nay tôi đã ở đâu" của riêng ngày hôm nay — EveningPanel tự fetch dữ liệu
          ngày qua getEveningDataAction(), nhưng phiên vừa start/backfill qua đồng hồ ở TRÊN
          không tự phản ánh vào lần fetch đó; nếu không truyền xuống, dòng này sẽ đứng yên
          (đã bắt gặp lỗi này lúc soi bằng mắt) — không đụng gì tới habit/mood/journal, vì
          những cái đó chỉ có EveningPanel ghi, không ai khác. */}
      <div ref={eveningMarkerRef}>
        <EveningPanel
          todayKey={todayKey}
          initialTodayData={initialEveningData}
          liveTodaySummaryLine={timer.summaryLine}
        />
      </div>
    </div>
  );
}
