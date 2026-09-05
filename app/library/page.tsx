import { LibraryScreen } from "@/components/library/LibraryScreen";
import { getJourneyLibraryDataAction } from "@/app/actions/library";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const cards = await getJourneyLibraryDataAction();
  return <LibraryScreen cards={cards} />;
}
