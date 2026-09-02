"use client";

import { useEffect, useRef, useState } from "react";
import { EveningPanel } from "@/components/evening/EveningPanel";
import { RoomScene, type TimeOfDay } from "@/components/room/RoomScene";
import type { CharacterPose } from "@/components/room/Character";
import { LevelUpToast } from "@/components/stats/LevelUpToast";
import { useComputedStats } from "@/components/stats/useComputedStats";
import type { ComputedStats } from "@/app/actions/stats";
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
  initialStats: ComputedStats;
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
  initialStats,
}: Props) {
  const { stats, refresh: refreshStats, levelUpNotice } = useComputedStats(initialStats);

  const timer = useSessionTimer({
    initialActiveSession,
    initialTodaySessions,
    initialSummaryLine,
    defaultLabelId: labels[0]?.id ?? 0,
    onXpMightHaveChanged: refreshStats,
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
    // Hai lớp phòng thủ để chuột THẬT chạm được canvas phòng 3D (OrbitControls, §5.3) — bắt
    // gặp cả hai lúc soi phòng ở mốc 3, tưởng xoay/zoom chạy được nhưng chuột không bao giờ tới
    // nơi:
    //  1. Không dùng z-index ÂM cho canvas (bỏ `-z-10` cũ) — z âm đẩy nó ra sau layer nền của
    //     CHÍNH stacking context gốc (tức là sau cả <body>), nên dù mắt vẫn thấy phòng (không
    //     gì che), việc dò trúng chuột lại dừng ở <body> trước khi tới canvas. Không cần z-index
    //     nào cả: canvas là con ĐẦU TIÊN trong div gốc, thứ tự DOM tự nhiên đã đẩy các anh em
    //     sau nó (khung nhìn đầu, nghi thức tối) lên trên khi chúng có nội dung che.
    //  2. `pointer-events-none` ở div gốc — div con nào cũng là một hộp thật, dù trong suốt
    //     không vẽ gì vẫn chặn hit-test tới canvas bên dưới ở chỗ trống không có nút nào. Mỗi
    //     khu vực thật sự cần bấm/cuộn (TimerOverlay/LevelUpToast, khối nghi thức tối) tự bật
    //     lại `pointer-events-auto` cho chính nó.
    <div className="relative pointer-events-none">
      {/* Phòng 3D — cố định phủ toàn màn hình phía sau nội dung cuộn (SPEC.md §5.1: "căn phòng
          3D chiếm phần lớn màn hình"). */}
      <div className="fixed inset-0">
        <RoomScene
          pose={pose}
          timeOfDay={timeOfDay}
          characterStage={stats.stage}
          unlockedItems={stats.unlockedItems}
        />
      </div>

      {/* Khung nhìn đầu — cao đúng một màn hình, đồng hồ nổi ở đây. */}
      <div className="relative h-svh w-full">
        <TimerOverlay {...timer} labels={labels} />
        <LevelUpToast notice={levelUpNotice} />
      </div>

      {/* Nghi thức tối — cuộn tới là gặp. `pointer-events-auto` vì cả khối này (habit/mood/
          journal/đóng ngày) cần bấm được bình thường — chỉ có khoảng trống ở khung nhìn đầu mới
          cần trong suốt với chuột. `timer.summaryLine` truyền xuống làm nguồn THẬT cho dòng
          "hôm nay tôi đã ở đâu" của riêng ngày hôm nay — EveningPanel tự fetch dữ liệu ngày qua
          getEveningDataAction(), nhưng phiên vừa start/backfill qua đồng hồ ở TRÊN không tự
          phản ánh vào lần fetch đó; nếu không truyền xuống, dòng này sẽ đứng yên (đã bắt gặp
          lỗi này lúc soi bằng mắt) — không đụng gì tới habit/mood/journal, vì những cái đó chỉ
          có EveningPanel ghi, không ai khác. */}
      <div ref={eveningMarkerRef} className="pointer-events-auto">
        <EveningPanel
          todayKey={todayKey}
          initialTodayData={initialEveningData}
          liveTodaySummaryLine={timer.summaryLine}
          onXpMightHaveChanged={refreshStats}
        />
      </div>
    </div>
  );
}
