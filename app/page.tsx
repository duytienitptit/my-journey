import { DailyScreen } from "@/components/DailyScreen";
import { getEveningDataAction } from "@/app/actions/evening";
import { getComputedStatsAction } from "@/app/actions/stats";
import { daySummaryLine } from "@/core/summary";
import { now } from "@/core/clock";
import { dayKeyOf } from "@/core/day";
import { getActiveSession, listActiveLabels, listSessionsForDay } from "@/db/queries";

// Trang này đọc DB mỗi lần vào — không cache tĩnh. Đồng hồ pomodoro và nghi thức tối phải luôn
// thấy dữ liệu mới nhất, không phải bản build lúc deploy.
export const dynamic = "force-dynamic";

export default async function Home() {
  const todayKey = dayKeyOf(now());

  const [labels, activeSession, todaySessions, eveningData, stats] = await Promise.all([
    listActiveLabels(),
    getActiveSession(),
    listSessionsForDay(todayKey),
    getEveningDataAction(todayKey),
    getComputedStatsAction(),
  ]);

  const completed = todaySessions.filter((s) => s.status === "completed");
  const summaryLine = daySummaryLine(completed.map((s) => ({ labelName: s.labelName })));

  return (
    <DailyScreen
      labels={labels}
      todayKey={todayKey}
      initialActiveSession={activeSession}
      initialTodaySessions={todaySessions}
      initialSummaryLine={summaryLine}
      initialEveningData={eveningData}
      initialStats={stats}
    />
  );
}
