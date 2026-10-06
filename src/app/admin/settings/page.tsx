import { requireRole } from "@/lib/auth/rbac";
import { getUniversitySettings } from "@/lib/settings";
import { UniversitySettingsForm } from "@/components/admin/university-settings-form";

export const dynamic = "force-dynamic";

export default async function UniversitySettingsPage() {
  await requireRole(["admin"]);
  const settings = await getUniversitySettings();

  return <UniversitySettingsForm initialSettings={settings} />;
}
