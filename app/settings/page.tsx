import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { getSettingsDataAction } from "@/app/actions/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const data = await getSettingsDataAction();
  return <SettingsScreen initialData={data} />;
}
