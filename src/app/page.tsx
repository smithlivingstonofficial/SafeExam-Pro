import { getUniversitySettings } from "@/lib/settings";
import { HomeClient } from "@/components/home/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getUniversitySettings();

  return <HomeClient settings={settings} />;
}
