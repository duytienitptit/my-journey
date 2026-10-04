import { DailyScreen } from "@/components/DailyScreen";
import { getEveningDataAction } from "@/app/actions/evening";
import { getComputedStatsAction } from "@/app/actions/stats";
import { getWeeklyReviewDataAction } from "@/app/actions/week";
import { daySummaryLine } from "@/core/summary";
import { now } from "@/core/clock";
import { dayKeyOf, isoWeekdayOf } from "@/core/day";
import { getActiveSession, listActiveLabels, listSessionsForDay } from "@/db/queries";

// Trang này đọc DB mỗi lần vào — không cache tĩnh. Đồng hồ pomodoro và nghi thức tối phải luôn
// thấy dữ liệu mới nhất, không phải bản build lúc deploy.
export const dynamic = "force-dynamic";

export default async function Home() {
  const todayKey = dayKeyOf(now());

  const activeSession = await getActiveSession();
  const [labels, todaySessions, eveningData, stats, weeklyData] = await Promise.all([
    listActiveLabels(),
    listSessionsForDay(todayKey),
    getEveningDataAction(todayKey),
    getComputedStatsAction(),
    isoWeekdayOf(todayKey) === 7 ? getWeeklyReviewDataAction() : Promise.resolve(null),
  ]);

  const completed = todaySessions.filter((s) => s.status === "completed");
  const summaryLine = daySummaryLine(completed.map((s) => ({ labelName: s.labelName })));

  return (
    <DailyScreen
      key={todayKey}
      labels={labels}
      todayKey={todayKey}
      initialActiveSession={activeSession}
      initialTodaySessions={todaySessions}
      initialSummaryLine={summaryLine}
      initialEveningData={eveningData}
      initialStats={stats}
      initialWeeklyData={weeklyData}
    />
  );
}
