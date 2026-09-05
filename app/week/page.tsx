import { WeekScreen } from "@/components/week/WeekScreen";
import { getWeeklyReviewDataAction } from "@/app/actions/week";

// Luôn đọc DB mới nhất, không cache tĩnh — giống app/page.tsx (SPEC.md §8.1).
export const dynamic = "force-dynamic";

export default async function WeekPage() {
  const data = await getWeeklyReviewDataAction();
  return <WeekScreen initialData={data} />;
}
