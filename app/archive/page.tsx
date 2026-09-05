import { ArchiveScreen } from "@/components/archive/ArchiveScreen";
import { getArchiveDataAction } from "@/app/actions/archive";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const data = await getArchiveDataAction();
  return <ArchiveScreen initialData={data} />;
}
