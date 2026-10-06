"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUniversitySettingsAction } from "@/app/actions/admin";
import { UniversitySettingsData } from "@/lib/settings";
import {
  Building2,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Clock,
  Radio,
} from "lucide-react";

interface UniversitySettingsFormProps {
  initialSettings: UniversitySettingsData;
}

export function UniversitySettingsForm({ initialSettings }: UniversitySettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [lockdownEnabled, setLockdownEnabled] = useState(initialSettings.lockdownBrowserRequired ?? true);
  const [registrationEnabled, setRegistrationEnabled] = useState(initialSettings.allowCandidateRegistration ?? false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    formData.set("lockdownBrowserRequired", lockdownEnabled ? "on" : "off");
    formData.set("allowCandidateRegistration", registrationEnabled ? "on" : "off");

    try {
      const result = await updateUniversitySettingsAction(formData);
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage("University settings and exam policies updated successfully.");
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to update settings. Please check your inputs.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Clean Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            University Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional identity, lockdown desktop application, and examination defaults.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            form="university-settings-form"
            disabled={isSaving}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2-Column Responsive Form */}
      <form id="university-settings-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Institution Profile & Contacts (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-700" />
                <h2 className="text-xs font-bold text-slate-900">
                  Institution Profile & Legal Title
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                Single University
              </span>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Official Legal University Name <span className="text-purple-700">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    defaultValue={initialSettings.name}
                    required
                    placeholder="e.g. Kalasalingam Academy of Research and Education"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admissions & Exam Control Email <span className="text-purple-700">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="contactEmail"
                    defaultValue={initialSettings.contactEmail || ""}
                    required
                    placeholder="exams@university.edu"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Exam Center Helpline (Phone)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="contactPhone"
                      defaultValue={initialSettings.contactPhone || ""}
                      placeholder="+91 (080) 2839-4000"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Campus Physical Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="address"
                      defaultValue={initialSettings.address || ""}
                      placeholder="Krishnan Koil, Tamil Nadu"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security Policies & Delivery Defaults (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Security & Integrity Switches */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-700" />
                <h2 className="text-xs font-bold text-slate-900">
                  Security & Anti-Cheat Policies
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                Enforced
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {/* Lockdown Browser Toggle Card */}
              <div
                onClick={() => setLockdownEnabled(!lockdownEnabled)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  lockdownEnabled
                    ? "bg-purple-50/60 border-purple-200/90"
                    : "bg-slate-50/60 border-slate-200"
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className={`w-3.5 h-3.5 ${lockdownEnabled ? "text-purple-700" : "text-slate-400"}`} />
                    <span>SafeExam Desktop Lockdown</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Blocks Alt-Tab, dual screens, devtools & screen sharing
                  </div>
                </div>

                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    lockdownEnabled ? "bg-purple-700 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </div>
              </div>

              {/* Self-Registration Toggle Card */}
              <div
                onClick={() => setRegistrationEnabled(!registrationEnabled)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  registrationEnabled
                    ? "bg-purple-50/60 border-purple-200/90"
                    : "bg-slate-50/60 border-slate-200"
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Candidate Self-Registration
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {registrationEnabled ? "Public registration enabled" : "Only admin provisions candidates"}
                  </div>
                </div>

                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    registrationEnabled ? "bg-purple-700 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Exam Delivery Defaults */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-purple-700" />
              <h2 className="text-xs font-bold text-slate-900">
                Exam Delivery Parameters
              </h2>
            </div>

            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Proctoring Standard
                </label>
                <select
                  name="defaultProctoringLevel"
                  defaultValue={initialSettings.defaultProctoringLevel}
                  className="w-full px-3 py-2 bg-slate-50/60 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all shadow-2xs"
                >
                  <option value="none">None (Open Assessment)</option>
                  <option value="basic">Basic (Tab & Window Blur Tracking)</option>
                  <option value="standard">Standard (Webcam + Audio Monitoring)</option>
                  <option value="full">Full (Webcam + Audio + AI Risk Scoring)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Answer Sync Delta
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="autoSaveFrequencySeconds"
                      defaultValue={initialSettings.autoSaveFrequencySeconds}
                      min={10}
                      max={120}
                      className="w-full px-3 py-2 bg-slate-50/60 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all shadow-2xs"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                      sec
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Idle Session Limit
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="sessionTimeoutMinutes"
                      defaultValue={initialSettings.sessionTimeoutMinutes}
                      min={15}
                      max={720}
                      className="w-full px-3 py-2 bg-slate-50/60 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all shadow-2xs"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                      mins
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
