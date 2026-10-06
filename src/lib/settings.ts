import { createAdminClient } from "@/lib/supabase/server";

export interface UniversitySettingsData {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  lockdownBrowserRequired: boolean;
  defaultProctoringLevel: "none" | "basic" | "standard" | "full";
  allowCandidateRegistration: boolean;
  sessionTimeoutMinutes: number;
  autoSaveFrequencySeconds: number;
  updatedAt?: string;
}

export const DEFAULT_UNIVERSITY_SETTINGS: UniversitySettingsData = {
  id: "default",
  name: "KALASALINGAM ACADEMY OF RESEARCH AND EDUCATION",
  logoUrl: null,
  address: "Krishnan Koil",
  contactEmail: "exams@klu.ac.in",
  contactPhone: "+91 (080) 2839-4000",
  lockdownBrowserRequired: true,
  defaultProctoringLevel: "standard",
  allowCandidateRegistration: true,
  sessionTimeoutMinutes: 180,
  autoSaveFrequencySeconds: 30,
};

export async function getUniversitySettings(): Promise<UniversitySettingsData> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("university_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_UNIVERSITY_SETTINGS;
    }

    const settingsJson = (data.settings || {}) as Record<string, unknown>;

    return {
      id: data.id,
      name: data.name || DEFAULT_UNIVERSITY_SETTINGS.name,
      logoUrl: data.logo_url || null,
      address: data.address || DEFAULT_UNIVERSITY_SETTINGS.address,
      contactEmail: data.contact_email || DEFAULT_UNIVERSITY_SETTINGS.contactEmail,
      contactPhone: data.contact_phone || DEFAULT_UNIVERSITY_SETTINGS.contactPhone,
      lockdownBrowserRequired: settingsJson.lockdown_browser_required !== false,
      defaultProctoringLevel:
        (settingsJson.default_proctoring_level as "none" | "basic" | "standard" | "full") ||
        "standard",
      allowCandidateRegistration: settingsJson.allow_candidate_registration !== false,
      sessionTimeoutMinutes: Number(settingsJson.session_timeout_minutes) || 180,
      autoSaveFrequencySeconds: Number(settingsJson.auto_save_frequency_seconds) || 30,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error("Error fetching university settings:", err);
    return DEFAULT_UNIVERSITY_SETTINGS;
  }
}
