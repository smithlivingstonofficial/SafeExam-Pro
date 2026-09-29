"use client";

import { useState } from "react";
import { updateUniversitySettingsAction } from "@/app/actions/admin";
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Building,
  Mail,
  Phone,
  MapPin,
  Lock,
  Camera,
  Timer,
  Users,
} from "lucide-react";

export default function UniversitySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await updateUniversitySettingsAction(formData);
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage("University settings and examination policies saved successfully.");
      }
    } catch {
      setErrorMessage("Failed to update settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
          Institution Configuration
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          University Settings & Exam Policies
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure single-institution identity, lockdown browser parameters, and proctoring defaults.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Institution Profile */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-purple-700" />
            <span>Institution Profile</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                University Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue="Apex State University Examination Board"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admissions / Examination Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                defaultValue="exams@apex-university.edu"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Examination Control Hotline (Phone)
              </label>
              <input
                type="tel"
                name="contactPhone"
                defaultValue="+91 (080) 2839-4000"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Campus Physical Address
              </label>
              <input
                type="text"
                name="address"
                defaultValue="Main Administrative Block, University Road, Academic City"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Examination Security & Anti-Cheat Policies */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-700" />
            <span>Examination Integrity & Anti-Cheating Policies</span>
          </h2>

          <div className="divide-y divide-slate-100">
            {/* Lockdown Browser Toggle */}
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Enforce Safe Lockdown Desktop Browser
                </span>
                <span className="text-[11px] text-slate-500">
                  Blocks Alt-Tab, dual screens, developer tools, and screen sharing processes during tests.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="lockdownBrowserRequired"
                  defaultChecked
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700" />
              </label>
            </div>

            {/* Candidate Self-Registration Toggle */}
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Allow Candidate Self-Registration Portal
                </span>
                <span className="text-[11px] text-slate-500">
                  Allows prospective applicants to register an account directly at /register.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="allowCandidateRegistration"
                  defaultChecked
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700" />
              </label>
            </div>

            {/* Proctoring Default */}
            <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Default Proctoring Level
                </span>
                <span className="text-[11px] text-slate-500">
                  Standard baseline assigned to newly composed exam papers.
                </span>
              </div>
              <div>
                <select
                  name="defaultProctoringLevel"
                  defaultValue="standard"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="none">None (Open Assessment)</option>
                  <option value="basic">Basic (Browser Tab Tracking only)</option>
                  <option value="standard">Standard (Webcam + Audio Telemetry)</option>
                  <option value="full">Full (Webcam + Audio + Screen Stream + AI Flags)</option>
                </select>
              </div>
            </div>

            {/* Auto-Save Frequency */}
            <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Realtime Auto-Save Frequency (Seconds)
                </span>
                <span className="text-[11px] text-slate-500">
                  How often candidate answers are pushed to Supabase during active exams.
                </span>
              </div>
              <div>
                <input
                  type="number"
                  name="autoSaveFrequencySeconds"
                  defaultValue={30}
                  min={10}
                  max={120}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Session Timeout */}
            <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Max Session Timeout (Minutes)
                </span>
                <span className="text-[11px] text-slate-500">
                  Automatic session expiry for candidate idle protection.
                </span>
              </div>
              <div>
                <input
                  type="number"
                  name="sessionTimeoutMinutes"
                  defaultValue={180}
                  min={30}
                  max={720}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 font-bold text-xs text-white shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-70 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Settings..." : "Save Institutional Policies"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
