import { StatsScreen } from "@/components/stats/StatsScreen";
import { getLongTermStatsAction } from "@/app/actions/longTermStats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const data = await getLongTermStatsAction();
  return <StatsScreen data={data} />;
}
