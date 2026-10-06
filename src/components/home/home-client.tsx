"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { UniversitySettingsData } from "@/lib/settings";
import { HeroSimulator } from "./hero-simulator";
import { SystemDiagnostic } from "./system-diagnostic";
import { ArchitectureShowcase } from "./architecture-showcase";
import { FaqSection } from "./faq-section";
import {
  ShieldCheck,
  Lock,
  Camera,
  Timer,
  FileSpreadsheet,
  Users,
  ArrowRight,
  Monitor,
  Activity,
  Award,
  School,
  Eye,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  Sparkles,
  Zap,
  CheckCircle2,
  Cpu,
  Layers,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

interface HomeClientProps {
  settings: UniversitySettingsData;
}

export function HomeClient({ settings }: HomeClientProps) {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

  // Smooth scroll progress and parallax tracking
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY);

          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          if (maxScroll > 0) {
            setScrollProgress(Math.min(100, Math.max(0, (currentScrollY / maxScroll) * 100)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Subtle interactive mouse parallax for hero
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: x * 20, y: y * 20 });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Top Scroll Depth Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-60 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Parallax Background Floating Ambient Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Radial Ambient Glow 1 */}
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-200/25 blur-3xl transition-transform ease-out duration-300"
          style={{
            transform: `translate3d(${mouseOffset.x * 0.5}px, ${scrollY * 0.15 + mouseOffset.y * 0.5}px, 0)`,
          }}
        />

        {/* Soft Radial Ambient Glow 2 */}
        <div
          className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-indigo-200/20 blur-3xl transition-transform ease-out duration-300"
          style={{
            transform: `translate3d(${mouseOffset.x * -0.4}px, ${scrollY * -0.1 + mouseOffset.y * -0.4}px, 0)`,
          }}
        />

        {/* Soft Radial Ambient Glow 3 */}
        <div
          className="absolute top-2/3 left-1/4 w-[28rem] h-[28rem] rounded-full bg-blue-100/30 blur-3xl transition-transform ease-out duration-300"
          style={{
            transform: `translate3d(0, ${scrollY * 0.08}px, 0)`,
          }}
        />

        {/* Ambient Subtle Grid Lines */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
      </div>

      {/* Sticky University Topbar Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & University Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center shadow-sm text-white group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                  SafeExam Pro
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold">
                  Institutional
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block truncate max-w-sm lg:max-w-md">
                {settings.name} • Examination Board
              </p>
            </div>
          </Link>

          {/* Quick Anchor Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#overview" className="hover:text-blue-700 transition-colors">
              Overview
            </a>
            <a href="#simulator" className="hover:text-blue-700 transition-colors">
              Live Simulator
            </a>
            <a href="#system-check" className="hover:text-blue-700 transition-colors">
              Pre-Flight Scan
            </a>
            <a href="#architecture" className="hover:text-blue-700 transition-colors">
              Security Pillars
            </a>
            <a href="#portals" className="hover:text-blue-700 transition-colors">
              Gateways
            </a>
            <a href="#faqs" className="hover:text-blue-700 transition-colors">
              FAQs
            </a>
          </nav>

          {/* Right Status Indicator & Login CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Proctor Grid Active</span>
            </div>

            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white transition-all shadow-xs hover:shadow-md flex items-center gap-1.5"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {/* HERO SECTION with Parallax Floating Badges */}
        <section
          id="overview"
          ref={heroRef}
          onMouseMove={handleMouseMove}
          className="relative pt-16 pb-24 sm:pt-20 sm:pb-32 overflow-hidden border-b border-slate-200/70"
        >
          {/* Parallax Floating Accent Badges (visible on desktop) */}
          <div
            className="hidden xl:flex absolute top-28 left-8 items-center gap-3 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg pointer-events-none transition-transform ease-out duration-300"
            style={{
              transform: `translate3d(${mouseOffset.x * 0.4}px, ${scrollY * 0.12 + mouseOffset.y * 0.4}px, 0)`,
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Zero Unauthorized Exits</div>
              <div className="text-[10px] text-slate-500">Lockdown Sandbox Guard</div>
            </div>
          </div>

          <div
            className="hidden xl:flex absolute top-36 right-8 items-center gap-3 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg pointer-events-none transition-transform ease-out duration-300"
            style={{
              transform: `translate3d(${mouseOffset.x * -0.4}px, ${scrollY * 0.16 + mouseOffset.y * -0.4}px, 0)`,
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">WebRTC Encrypted Grid</div>
              <div className="text-[10px] text-slate-500">60 FPS AI Telemetry</div>
            </div>
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* University Tag Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs text-slate-700 mb-6 shadow-2xs font-semibold">
              <School className="w-4 h-4 text-blue-600" />
              <span className="truncate max-w-md sm:max-w-xl font-bold">{settings.name}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight sm:leading-tight">
              Next-Generation Secure <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900">
                Entrance Examination Platform
              </span>
            </h1>

            {/* Sub-headline description */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              SafeExam Pro provides tamper-proof academic evaluation for {settings.name} through
              kernel-grade lockdown enforcement, live dual-signal AI & human proctoring, sub-second
              cloud auto-save, and immutable cryptographic audit trails.
            </p>

            {/* Quick Action CTA Row */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#system-check"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 font-bold text-white shadow-md shadow-blue-700/20 transition-all hover:shadow-lg cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
                <span>Test Candidate System</span>
              </a>
              <a
                href="#simulator"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 font-bold text-slate-800 transition-all shadow-xs cursor-pointer hover:border-slate-400"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Interactive Simulator</span>
              </a>
              <a
                href="#portals"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
              >
                <span>Institutional Portals</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Key Trust Metrics Strip */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white p-5 rounded-2xl text-left border border-slate-200/90 shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-1.5 text-blue-700 mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Lockdown Engine
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {settings.lockdownBrowserRequired ? "Enforced" : "Active"}
                </div>
                <div className="text-xs text-slate-500 mt-1">Full-screen & shortcut isolation</div>
              </div>

              <div className="bg-white p-5 rounded-2xl text-left border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-1.5 text-indigo-700 mb-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Proctoring Tier
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 capitalize">
                  {settings.defaultProctoringLevel}
                </div>
                <div className="text-xs text-slate-500 mt-1">Multi-signal telemetry supervision</div>
              </div>

              <div className="bg-white p-5 rounded-2xl text-left border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                  <Timer className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Auto-Save Rate
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {settings.autoSaveFrequencySeconds}s
                </div>
                <div className="text-xs text-slate-500 mt-1">Encrypted zero-data-loss sync</div>
              </div>

              <div className="bg-white p-5 rounded-2xl text-left border border-slate-200/90 shadow-xs hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-1.5 text-purple-700 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Audit Trail
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">Immutable</div>
                <div className="text-xs text-slate-500 mt-1">Forensic timeline verification</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Interactive Live Simulator Showcase */}
        <section id="simulator" className="py-20 bg-slate-100/50 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                Interactive Technology Demo
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Live Examination & Proctoring Cockpit
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Toggle between the Candidate Lockdown Shell and the Supervisor Live Grid. Test an interactive question answer or simulate a real-time telemetry incident flag.
              </p>
            </div>

            <HeroSimulator
              universityName={settings.name}
              lockdownRequired={settings.lockdownBrowserRequired}
              autoSaveSeconds={settings.autoSaveFrequencySeconds}
            />
          </div>
        </section>

        {/* SECTION 3: Candidate Pre-Flight System Diagnostic */}
        <section id="system-check" className="py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SystemDiagnostic
              universityName={settings.name}
              lockdownBrowserRequired={settings.lockdownBrowserRequired}
            />
          </div>
        </section>

        {/* SECTION 4: Architecture & Security Pillars */}
        <section id="architecture" className="py-24 bg-slate-50/60 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ArchitectureShowcase
              autoSaveSeconds={settings.autoSaveFrequencySeconds}
              lockdownRequired={settings.lockdownBrowserRequired}
            />
          </div>
        </section>

        {/* SECTION 5: University Gateways (Role Portals) */}
        <section id="portals" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              University Gateways
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Institutional Access Portals
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              Select your authorized university role to access examination, authoring, and monitoring tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Candidate Portal */}
            <Link
              href="/candidate"
              className="bg-white light-card-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-xs hover:border-blue-400 group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50/60 px-2 py-0.5 rounded inline-block mb-1.5">
                  Candidates & Applicants
                </div>
                <h3 className="text-lg font-bold text-slate-900">Candidate Lobby</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Identity verification, admit card validation, scheduled entrance exam sessions, and published score reports.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-blue-700 group-hover:text-blue-800 flex items-center gap-1.5">
                  Candidate Login <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>

            {/* Examiner Portal */}
            <Link
              href="/examiner"
              className="bg-white light-card-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-xs hover:border-indigo-400 group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mb-4 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50/60 px-2 py-0.5 rounded inline-block mb-1.5">
                  Academic Faculty
                </div>
                <h3 className="text-lg font-bold text-slate-900">Examiner Suite</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Question bank authoring with LaTeX equations, exam composing, marking scheme setup, and question analytics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-indigo-700 group-hover:text-indigo-800 flex items-center gap-1.5">
                  Examiner Login <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>

            {/* Proctor Portal */}
            <Link
              href="/proctor"
              className="bg-white light-card-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-xs hover:border-emerald-400 group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4 group-hover:scale-105 transition-transform">
                  <Eye className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded inline-block mb-1.5">
                  Invigilation Staff
                </div>
                <h3 className="text-lg font-bold text-slate-900">Proctor Monitor</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Live multi-candidate video grid, AI anomaly incident flags, candidate whisper warnings, and exam termination controls.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1.5">
                  Proctor Console <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>

            {/* University Admin */}
            <Link
              href="/admin"
              className="bg-white light-card-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-xs hover:border-purple-400 group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 mb-4 group-hover:scale-105 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50/60 px-2 py-0.5 rounded inline-block mb-1.5">
                  Board & Administration
                </div>
                <h3 className="text-lg font-bold text-slate-900">University Admin</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Institutional governance, departmental rosters, RBAC role management, audit log forensic replay, and result publishing.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-purple-700 group-hover:text-purple-800 flex items-center gap-1.5">
                  Admin Control <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* SECTION 6: FAQ & Helpdesk */}
        <section id="faqs" className="py-24 bg-white border-t border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <FaqSection
              universityName={settings.name}
              contactEmail={settings.contactEmail}
              contactPhone={settings.contactPhone}
              lockdownRequired={settings.lockdownBrowserRequired}
              autoSaveSeconds={settings.autoSaveFrequencySeconds}
            />
          </div>
        </section>
      </main>

      {/* Professional University Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">SafeExam Pro</span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 font-bold px-1.5 py-0.5 rounded">
                    Single University Edition
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">{settings.name}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-500 text-xs">
              <a href="#overview" className="hover:text-blue-700 transition-colors">
                Back to Top
              </a>
              <a href="#system-check" className="hover:text-blue-700 transition-colors">
                System Diagnostic
              </a>
              <a href="#portals" className="hover:text-blue-700 transition-colors">
                Gateways
              </a>
              <Link href="/login" className="font-bold text-blue-700 hover:underline">
                Portal Login
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
            <div>
              © {new Date().getFullYear()} {settings.name}. SafeExam Pro Architecture. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Next.js 16 • Supabase PostgreSQL • Light Theme Enforced</span>
            </div>
          </div>

          {(settings.address || settings.contactEmail || settings.contactPhone) && (
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-slate-500 text-[11px]">
              {settings.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{settings.address}</span>
                </div>
              )}
              <div className="flex items-center gap-5">
                {settings.contactEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{settings.contactEmail}</span>
                  </div>
                )}
                {settings.contactPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{settings.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
