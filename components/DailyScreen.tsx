"use client";

import { useCallback, useEffect, useState } from "react";
import { now } from "@/core/clock";
import { dayKeyOf } from "@/core/day";
import { useGrovePreview } from "@/components/dev/GrovePreviewContext";
import { EveningPanel } from "@/components/evening/EveningPanel";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { LevelUpToast } from "@/components/stats/LevelUpToast";
import { StreakBrokenToast } from "@/components/stats/StreakBrokenToast";
import { StreakMilestoneToast } from "@/components/stats/StreakMilestoneToast";
import { useComputedStats } from "@/components/stats/useComputedStats";
import type { ComputedStats } from "@/app/actions/stats";
import { xpRequiredForLevel } from "@/core/engine/levels";
import { FocusSession, TimerOverlay, type TimerLabel } from "@/components/timer/TimerOverlay";
import { useSessionTimer } from "@/components/timer/useSessionTimer";
import type { ActiveSession } from "@/components/timer/useSessionTimer";
import { getEveningDataAction, type EveningData } from "@/app/actions/evening";
import { getWeeklyReviewDataAction, type WeeklyReviewData } from "@/app/actions/week";
import type { SessionForDay } from "@/db/queries";
import { TodayHeader } from "@/components/home/TodayHeader";
import { TodayPager } from "@/components/home/TodayPager";
import { NetWorthControl } from "@/components/assets/NetWorthControl";
import { STAT_KEYS, type DayKey, type StatKey } from "@/core/types";

type Props = {
  labels: readonly TimerLabel[];
  todayKey: DayKey;
  initialActiveSession: ActiveSession | null;
  initialTodaySessions: SessionForDay[];
  initialSummaryLine: string;
  initialEveningData: EveningData;
  initialStats: ComputedStats;
  initialWeeklyData: WeeklyReviewData | null;
};

/**
 * Today and check-in share one horizontal viewport and one live timer/data owner.
 * Both panels stay mounted so swiping preserves unsaved journal text.
 */
export function DailyScreen({
  labels,
  todayKey,
  initialActiveSession,
  initialTodaySessions,
  initialSummaryLine,
  initialEveningData,
  initialStats,
  initialWeeklyData,
}: Props) {
  const [page, setPage] = useState(0);
  useEffect(() => {
    const followHash = () => { if (window.location.hash === "#evening") setPage(1); };
    const frame = requestAnimationFrame(followHash);
    window.addEventListener("hashchange", followHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", followHash); };
  }, []);
  const {
    stats,
    refresh: refreshStats,
    levelUpNotice,
    streakMilestoneNotice,
    streakBrokenNotice,
  } = useComputedStats(initialStats);

  useEffect(() => {
    function checkDay() {
      if (document.visibilityState === "visible" && dayKeyOf(now()) !== todayKey) window.location.reload();
    }
    const interval = window.setInterval(checkDay, 30_000);
    document.addEventListener("visibilitychange", checkDay);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", checkDay); };
  }, [todayKey]);

  // Sáu việc hôm nay cho dashboard màn chính — `initialEveningData` chỉ đúng tại thời điểm tải
  // trang; bấm Start hay ghi bù xong là lệch ngay. Fetch lại cùng nhịp với refreshStats, vì MỌI
  // hành động đổi XP đều đã đi qua một chỗ duy nhất đó rồi (timer + nghi thức tối).
  const [eveningToday, setEveningToday] = useState(initialEveningData);
  const [weeklyData, setWeeklyData] = useState(initialWeeklyData);
  const handleXpMightHaveChanged = useCallback(() => {
    refreshStats();
    void getEveningDataAction(todayKey).then(setEveningToday).catch(() => { /* Timer/editor reports write errors; keep last confirmed data. */ });
    if (initialWeeklyData) void getWeeklyReviewDataAction().then(setWeeklyData).catch(() => { /* Keep the last confirmed weekly summary. */ });
  }, [refreshStats, todayKey, initialWeeklyData]);

  const timer = useSessionTimer({
    initialActiveSession,
    initialTodaySessions,
    initialSummaryLine,
    defaultLabelId: labels[0]?.id ?? 0,
    onXpMightHaveChanged: handleXpMightHaveChanged,
  });

  // Xem trước khu vườn lớn lên (2026-09-17, chỉ dev — GrovePreviewWidget.tsx) — KHÔNG đụng dữ
  // liệu thật ở `stats`, chỉ ghi đè đúng ba prop hình ảnh mà `HomeDashboard` cần khi chủ dự án
  // đang bật ô xem trước. `override` luôn `null` ở production (không có widget nào gọi
  // `setOverride`), nên nhánh này không đổi hành vi gì ngoài dev.
  const { override: grovePreview } = useGrovePreview();
  const groveLevelByStat = grovePreview?.levelByStat ?? stats.levelByStat;
  // Không có "XP giả" nào để hiện khi xem trước — dùng đúng ngưỡng XP cần để CHẠM cấp đang chọn
  // (progress 0% vào cấp kế tiếp). Đủ cho mục đích xem HÌNH DẠNG cây, không cần đúng số thật.
  const groveXpByStat: Record<StatKey, number> = grovePreview
    ? Object.fromEntries(STAT_KEYS.map((stat) => [stat, xpRequiredForLevel(grovePreview.levelByStat[stat])])) as Record<StatKey, number>
    : stats.xpByStat;
  const groveNeglectByStat = grovePreview?.neglectByStat ?? stats.neglectDangerByStat;
  const groveDayAchievedStreak = grovePreview
    ? { ...stats.dayAchievedStreak, current: grovePreview.streak, danger: grovePreview.danger }
    : stats.dayAchievedStreak;

  return (
    <div className={`journey-app ${timer.running ? "is-focusing" : ""}`}>
      <div inert={timer.running !== null}>
        <TodayHeader />
        <TodayPager page={page} onPageChange={setPage} disabled={timer.running !== null}>
          {[
            <HomeDashboard key="grove"
              levelByStat={groveLevelByStat} xpByStat={groveXpByStat}
              neglectDangerByStat={groveNeglectByStat} dayAchievedStreak={groveDayAchievedStreak}
              chapter={stats.chapter} checkIn={eveningToday.checkIn} sessions={timer.todaySessions}
              visible={page === 0 && !timer.running} onWrapWeek={weeklyData ? () => {
                setPage(1);
                requestAnimationFrame(() => {
                  const target = document.getElementById("week-wrap-up");
                  const panel = target?.closest(".today-panel");
                  if (target && panel) panel.scrollTo({ top: target.offsetTop, behavior: "smooth" });
                });
              } : undefined}>
              <TimerOverlay timer={timer} labels={labels} active={page === 0}/>
            </HomeDashboard>,
            <EveningPanel key="check-in" todayKey={todayKey} todayData={eveningToday} weeklyData={weeklyData}
              onTodayDataChange={setEveningToday} liveTodaySummaryLine={timer.summaryLine}
              onXpMightHaveChanged={handleXpMightHaveChanged}
              onBackfillOneSession={(labelId) => timer.backfill(labelId, 1)}
              onUndoBackfillSession={(labelId) => timer.undoBackfill(labelId)}/>,
          ]}
        </TodayPager>
        <footer className="today-footer">
          <div className="journey-assets"><NetWorthControl netWorth={stats.netWorth} hideMoney={stats.hideMoney} onChanged={refreshStats}/></div>
          <div className="pager-indicator">
            <p aria-live="polite">{page === 0 ? "Swipe left for check-in" : "Swipe right to return to your grove"}</p>
            <div role="group" aria-label="Today panels">
              <button aria-label="Show your grove" aria-pressed={page === 0} onClick={() => setPage(0)}/>
              <button aria-label="Show daily check-in" aria-pressed={page === 1} onClick={() => setPage(1)}/>
            </div>
          </div>
          <span className="keyboard-hint">Drag or use ← →</span>
        </footer>
      </div>
      <FocusSession timer={timer} labels={labels}/>
      {timer.error && <div role="alert" className="timer-error"><span>{timer.error}</span><button disabled={timer.pending} onClick={timer.retry}>Refresh status</button></div>}
      <LevelUpToast notice={levelUpNotice}/>
      <StreakMilestoneToast notice={streakMilestoneNotice}/>
      <StreakBrokenToast notice={streakBrokenNotice}/>
    </div>
  );
}
