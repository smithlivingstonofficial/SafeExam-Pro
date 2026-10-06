"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Video,
  Building2,
  Users,
  GraduationCap,
  Clock,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Play,
  FileText,
  Settings,
  Lock,
  MonitorOff,
  Send,
  RefreshCw,
  Award,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ShieldCheck,
  Eye,
  CheckSquare,
  Square,
  Copy,
  Check,
  Laptop,
  Terminal,
  AlertOctagon,
  Key,
  ShieldAlert,
  Database,
  Sliders,
  Maximize2,
  UserCheck,
  XCircle,
  FileCode,
} from "lucide-react";

interface AdminDocsClientProps {
  adminName: string;
  universityName: string;
  stats: {
    departments: number;
    candidates: number;
    faculty: number;
    exams: number;
    schedules: number;
    activeExams: number;
  };
}

export function AdminDocsClient({
  adminName,
  universityName,
  stats,
}: AdminDocsClientProps) {
  const [activeTab, setActiveTab] = useState<
    "lifecycle" | "modules" | "simulator" | "checklist" | "rbac" | "troubleshooting" | "shortcuts"
  >("lifecycle");

  const [activeLifecycleStep, setActiveLifecycleStep] = useState<number>(1);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Simulator State
  const [simFullscreenExits, setSimFullscreenExits] = useState(0);
  const [simTabSwitches, setSimTabSwitches] = useState(0);
  const [simProctorWarning, setSimProctorWarning] = useState<string | null>(null);
  const [simTerminated, setSimTerminated] = useState(false);

  // Interactive Checklist State
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    departments: stats.departments > 0,
    faculty: stats.faculty > 0,
    candidates: stats.candidates > 0,
    exams: stats.exams > 0,
    schedules: stats.schedules > 0,
    proctors: false,
    lockdownVerified: true,
    browserPolicy: true,
  });

  const toggleChecklistItem = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const checklistScore = useMemo(() => {
    const total = Object.keys(checklist).length;
    const completed = Object.values(checklist).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  }, [checklist]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 6-Step Exam Lifecycle Definition
  const LIFECYCLE_STEPS = [
    {
      step: 1,
      title: "Academic Department Setup",
      route: "/admin/departments",
      role: "Administrator",
      icon: Building2,
      duration: "5 mins",
      summary: "Configure faculty departments (e.g., Computer Science, Bioengineering, Humanities) with department codes.",
      prerequisites: "None (Initial system bootstrapping).",
      actionItems: [
        "Navigate to Academic Departments from the admin sidebar.",
        "Click '+ Add Department' to create department records with title and official code (e.g. 'CSE', 'MECH').",
        "Departments group candidates, question banks, and faculty for clean departmental governance.",
      ],
      quickTip: "Department codes are permanently linked to candidate hall ticket registration formats.",
    },
    {
      step: 2,
      title: "Faculty & Invigilator Delegation",
      route: "/admin/users",
      role: "Administrator",
      icon: Users,
      duration: "10 mins",
      summary: "Onboard Examiners for authoring question banks and Proctors for real-time video surveillance.",
      prerequisites: "Academic departments must be created first.",
      actionItems: [
        "Go to User & Faculty Roster and click '+ Create User'.",
        "Select the role: 'Examiner' (creates questions, sets schedules, grades papers) or 'Proctor' (monitors live streams).",
        "Assign the user to their respective academic department.",
        "Securely distribute the login credentials to faculty members.",
      ],
      quickTip: "Admins maintain superset access and can switch into Examiner Suite and Proctor Hub at any time.",
    },
    {
      step: 3,
      title: "Candidate Enrollment & Passwords",
      route: "/admin/students",
      role: "Administrator",
      icon: GraduationCap,
      duration: "15 mins",
      summary: "Register Ph.D candidates individually or import bulk student rosters via CSV.",
      prerequisites: "Department records ready.",
      actionItems: [
        "Open Candidate Roster and click '+ Register Candidate'.",
        "Enter Candidate Full Name, Official Email Address, Department, and Default Entrance Password.",
        "Verify candidate allocations and inspect enrollment statuses in the roster table.",
        "Candidates will use these credentials on the candidate entrance gate `/candidate/login`.",
      ],
      quickTip: "You can click on any candidate row to inspect their full surveillance dossier, active allocations, and anti-cheat history.",
    },
    {
      step: 4,
      title: "Blueprint Design & Question Banks",
      route: "/examiner/exams",
      role: "Examiner / Admin",
      icon: Layers,
      duration: "20 mins",
      summary: "Author multi-section exam blueprints, set cutoffs, negative marking, and populate question banks.",
      prerequisites: "Academic department selected.",
      actionItems: [
        "Switch to Examiner Suite > Blueprint Designer (`/examiner/exams`).",
        "Click '+ Create Exam Blueprint' to specify total duration, pass mark, sections, and negative marking rules.",
        "Open Question Banks (`/examiner/banks`) to add MCQs (Single/Multiple), NAT (Numerical), or Descriptive questions.",
        "Utilize AI Question Generator to draft domain-specific Ph.D level questions instantly.",
      ],
      quickTip: "SafeExam Pro automatically validates sectional quotas and scoring schemes before allowing blueprint publication.",
    },
    {
      step: 5,
      title: "Exam Scheduling & Lockdown Window",
      route: "/examiner/schedules",
      role: "Examiner / Admin",
      icon: Clock,
      duration: "10 mins",
      summary: "Define the official exam window, assign student batches, and activate security lockdowns.",
      prerequisites: "Exam blueprint must have approved questions.",
      actionItems: [
        "Navigate to Exam Schedules (`/examiner/schedules`) and click '+ Create Schedule Window'.",
        "Select the Exam Blueprint, designated Academic Department, Start Time, and End Time.",
        "System automatically provisions candidate exam allocations with secure session tokens.",
        "Before starting, candidates must complete pre-exam hardware check (Webcam, Mic, Fullscreen Lockdown).",
      ],
      quickTip: "The exam portal opens strictly at the scheduled start time and auto-submits upon timer expiration.",
    },
    {
      step: 6,
      title: "Live Proctoring & Scorecard Release",
      route: "/proctor",
      role: "Proctor / Admin",
      icon: Video,
      duration: "During & After Exam",
      summary: "Conduct real-time webcam surveillance, monitor anti-cheat telemetry, and publish scorecards.",
      prerequisites: "Active exam schedule in progress.",
      actionItems: [
        "Launch the Live Proctor Hub (`/proctor`) to monitor candidate video feeds and real-time risk scores.",
        "Inspect separate indicators for Fullscreen Exits (rose badge) and Tab / Window switches (amber badge).",
        "Send 1-click warning alerts to candidate screens or terminate unauthorized sessions immediately.",
        "Once finished, navigate to Examiner Grading (`/examiner/grading`) to moderate scores and publish scorecards.",
      ],
      quickTip: "Audit logs record all proctor warnings, fullscreen breaches, and score publication actions with immutable timestamps.",
    },
  ];

  // Detailed Modules
  const MODULE_GUIDES = [
    {
      title: "Candidate Exam Environment & Anti-Cheat",
      icon: Laptop,
      badge: "Candidate Interface",
      route: "/candidate",
      description:
        "The candidate examination engine is built to national entrance exam standards (TCS iON / GATE specification) with high-security browser lockdown.",
      sections: [
        {
          heading: "1. Pre-Check & Hardware Verification",
          content:
            "Before entering the exam hall, candidates undergo an automated 4-step pre-flight check: System Compatibility, Webcam Stream Validation, Audio Microphone Check, and Mandatory Fullscreen Lockdown request.",
        },
        {
          heading: "2. GATE / TCS iON 5-State Question Palette",
          content:
            "Every question in the palette displays one of 5 standard states: Answered (Green ✓), Not Answered (Rose ✕), Marked for Review (Amber ★), Answered & Marked for Review (Purple ✦), or Not Visited (Gray •).",
        },
        {
          heading: "3. Fullscreen Perimeter & Window Blur Lockdown",
          content:
            "If a candidate exits fullscreen (Esc / F11) or clicks another window/tab, SafeExam Pro immediately blurs the examination questions, logs a timestamped infraction incident to the proctor, increments the candidate's violation counter, and triggers a full-page perimeter lock modal requiring them to re-enter fullscreen.",
        },
        {
          heading: "4. Built-in Scientific Calculator & Paper Preview",
          content:
            "Candidates have access to a clean virtual calculator (supporting trig, log, sqrt, power functions) and an institutional question paper preview drawer without leaving full-screen mode.",
        },
        {
          heading: "5. Offline Resilience & Auto-Save",
          content:
            "Responses are immediately synced to PostgreSQL. In the event of a brief internet hiccup, answers are safely stored in browser encrypted local cache and automatically flushed once connectivity resumes.",
        },
      ],
    },
    {
      title: "Live Proctor Console & Real-time Telemetry",
      icon: Video,
      badge: "Surveillance Suite",
      route: "/proctor",
      description:
        "The Proctor Hub allows invigilators to supervise multiple candidates simultaneously with automated anomaly detection and direct intervention tools.",
      sections: [
        {
          heading: "1. Dual Flag Categorization (Fullscreen vs Tabs)",
          content:
            "The surveillance system distinctly separates 'Fullscreen Perimeter Exits' (rose badge) from 'Tab / Window Switches' (amber badge). Proctors can filter the grid by high risk, fullscreen violators, or tab switchers in 1 click.",
        },
        {
          heading: "2. Real-time Risk Score Algorithm",
          content:
            "Risk scores range from 0 to 100. Each fullscreen exit adds +25 risk, each tab switch adds +20 risk, and suspicious keyboard shortcuts add +10. Scores ≥ 60 trigger High Risk status.",
        },
        {
          heading: "3. Direct Proctor Warning Broadcast",
          content:
            "Invigilators can send customized or preset warnings (e.g. 'Fullscreen perimeter lost! Return to full screen exam immediately'). The warning interrupts the candidate's screen with an audible chime requiring acknowledgment.",
        },
        {
          heading: "4. Emergency Disqualification / Termination",
          content:
            "For severe or repeated breaches, proctors or administrators can execute instant session termination with logged justification. The student's portal is immediately locked, answers are submitted as-is, and the incident is recorded in audit logs.",
        },
      ],
    },
    {
      title: "Exam Blueprinting & Multi-Type Questions",
      icon: Layers,
      badge: "Examiner Suite",
      route: "/examiner/exams",
      description:
        "Comprehensive exam authoring suite allowing university examiners to design multi-sectional entrance tests with flexible marking schemes.",
      sections: [
        {
          heading: "1. Question Types Supported",
          content:
            "SafeExam Pro natively supports 4 question paradigms: MCQ Single Answer (Single choice), MCQ Multiple Answer / MSQ (Partial/Exact match), NAT (Numerical Answer Type with integer/float tolerance range), and Descriptive / Long Form Essay.",
        },
        {
          heading: "2. Sectional Blueprints & Negative Marking",
          content:
            "Configure distinct sections (e.g. 'Part A: Research Aptitude', 'Part B: Computer Architecture'). Each section can define custom positive marks per question and negative marking penalties (e.g. -0.25 or -0.33).",
        },
        {
          heading: "3. AI Question Bank Assistant",
          content:
            "Examiners can leverage the built-in AI authoring assistant to generate doctoral-level questions complete with answer options, numerical tolerances, and detailed explanations based on subject topics.",
        },
      ],
    },
    {
      title: "Candidate Management & Surveillance Dossier",
      icon: GraduationCap,
      badge: "Admin Core",
      route: "/admin/students",
      description:
        "Centralized repository of all registered entrance candidates, their assigned schedules, and historical anti-cheat records.",
      sections: [
        {
          heading: "1. Candidate Roster & Quick Filters",
          content:
            "Inspect candidate statuses (Pending, Allocated, Completed) with quick filters for '⚠️ Surveillance Flagged', '🖥️ Fullscreen Exits', and '🔄 Tab Switches'.",
        },
        {
          heading: "2. Student Detail Drawer & Incident Logs",
          content:
            "Clicking any student row opens a detailed slide-over drawer displaying their active allocations, scorecards, and a dedicated Surveillance Incident Telemetry breakdown with exact incident counts.",
        },
      ],
    },
    {
      title: "Score Moderation, Grading & Publishing",
      icon: Award,
      badge: "Examiner Suite",
      route: "/examiner/grading",
      description:
        "Automated grading engine with percentile rankings and official scorecard release workflow.",
      sections: [
        {
          heading: "1. Automated MCQ & NAT Evaluation",
          content:
            "Objective questions are automatically evaluated immediately upon exam submission using blueprint negative marking rules and NAT numerical tolerance bands.",
        },
        {
          heading: "2. Percentile Rank Calculation",
          content:
            "Percentiles are calculated relative to all candidates who appeared in the examination schedule according to standard university admission formulas.",
        },
        {
          heading: "3. Moderation & 1-Click Scorecard Publishing",
          content:
            "Examiners can review candidate surveillance flags before releasing results. Once approved, clicking 'Publish Scorecard' (or bulk publishing) makes the official scorecard instantly visible on the candidate portal.",
        },
      ],
    },
    {
      title: "Audit & Security Logs",
      icon: FileCode,
      badge: "Admin Security",
      route: "/admin/audit",
      description:
        "Every mutating operation, proctor intervention, blueprint edit, and score release is permanently logged to an immutable audit trail.",
      sections: [
        {
          heading: "1. Tamper-Proof Audit Schema",
          content:
            "Audit records capture Action Type, Actor ID, Actor Role, Target Entity ID, IP Address, Timestamp, and previous/new state JSON diffs.",
        },
        {
          heading: "2. Compliance & Verification",
          content:
            "Allows university accreditation bodies and examination boards to verify the integrity and timeline of all entrance test operations.",
        },
      ],
    },
  ];

  // FAQs
  const TROUBLESHOOTING_FAQS = [
    {
      q: "What happens if a candidate's internet disconnects during an examination?",
      a: "SafeExam Pro handles offline events gracefully. The candidate's answers are cached in browser storage with status indicators ('Offline / Local Sync'). Once internet is restored, answers automatically sync to the server. The exam timer continues running against the server-verified scheduled end time.",
    },
    {
      q: "Can a candidate cheat by opening Developer Tools or Right-Clicking?",
      a: "No. Right-click context menus, developer shortcut keys (F12, Ctrl+Shift+I, Ctrl+U), copy-pasting, and print-screen keys are intercepted and disabled. Any attempt logs an anti-cheat incident to the live proctor console.",
    },
    {
      q: "How does the platform distinguish between a Fullscreen Exit and Tab Switching?",
      a: "Fullscreen perimeter loss is detected via the HTML5 Fullscreen API (`fullscreenchange` event). Tab switches and minimizing are detected via the Page Visibility API (`visibilitychange` event) and window focus blur. Both are logged with separate incident types and counter badges.",
    },
    {
      q: "How can an administrator or examiner reset an exam for a candidate facing a machine breakdown?",
      a: "An administrator can navigate to Candidate Roster (`/admin/students`), locate the candidate, and re-allocate the exam schedule or update their assignment record to allow a fresh supervised attempt.",
    },
    {
      q: "Are dark themes supported?",
      a: "No. SafeExam Pro is strictly built on an elegant, high-contrast, clean modern Light Theme (crisp white/slate surfaces, slate-900 typography, and royal purple/indigo accents) per university institutional standards.",
    },
  ];

  // Filtered Content based on search
  const filteredSteps = useMemo(() => {
    if (!searchQuery) return LIFECYCLE_STEPS;
    return LIFECYCLE_STEPS.filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.actionItems.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return MODULE_GUIDES;
    return MODULE_GUIDES.filter(
      (m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sections.some(
          (sec) =>
            sec.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sec.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [searchQuery]);

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 pb-16">
      {/* 1. Hero / Header Banner */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full">
                    Official Admin Operation Manual
                  </span>
                  <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                  <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                    v2.0 Enterprise
                  </span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                SafeExam Pro Administrative Playbook
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Comprehensive step-by-step guidance, interactive feature simulations, and operational protocols for managing entrance exams at {universityName}.
              </p>
            </div>

            {/* Quick Live System Metrics */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-2 sm:p-3 shrink-0">
              <div className="text-center px-3 border-r border-slate-200/80">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Depts</span>
                <span className="text-base font-black text-slate-900">{stats.departments}</span>
              </div>
              <div className="text-center px-3 border-r border-slate-200/80">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Candidates</span>
                <span className="text-base font-black text-slate-900">{stats.candidates}</span>
              </div>
              <div className="text-center px-3 border-r border-slate-200/80">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Blueprints</span>
                <span className="text-base font-black text-slate-900">{stats.exams}</span>
              </div>
              <div className="text-center px-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Schedules</span>
                <span className="text-base font-black text-purple-700">{stats.schedules}</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 max-w-2xl">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent transition-all shadow-2xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search across operational steps, modules, anti-cheat logic, or FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto [scrollbar-width:none] border-t border-slate-100 pt-4">
            <button
              onClick={() => setActiveTab("lifecycle")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "lifecycle"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>6-Step Exam Lifecycle</span>
            </button>

            <button
              onClick={() => setActiveTab("modules")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "modules"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Module Deep Dives ({MODULE_GUIDES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "simulator"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Interactive Telemetry Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab("checklist")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "checklist"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Pre-Exam Readiness Checklist</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-black">
                {checklistScore}%
              </span>
            </button>

            <button
              onClick={() => setActiveTab("rbac")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "rbac"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBAC Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab("troubleshooting")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "troubleshooting"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FAQ &amp; Emergency Playbook</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Tab Body */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* =========================================================================
            TAB 1: 6-STEP EXAM LIFECYCLE
        ========================================================================== */}
        {activeTab === "lifecycle" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Step Selector Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {filteredSteps.map((s) => {
                const Icon = s.icon;
                const isSelected = activeLifecycleStep === s.step;

                return (
                  <button
                    key={s.step}
                    onClick={() => setActiveLifecycleStep(s.step)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-purple-700 text-white border-purple-800 shadow-md scale-[1.02] z-10"
                        : "bg-white text-slate-700 border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isSelected
                              ? "bg-purple-800 text-purple-100"
                              : "bg-slate-100 text-slate-500 font-bold"
                          }`}
                        >
                          Step 0{s.step}
                        </span>
                        <Icon className={`w-4 h-4 ${isSelected ? "text-purple-200" : "text-slate-400"}`} />
                      </div>
                      <div className="font-bold text-xs leading-snug truncate">{s.title}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] opacity-80">
                      <span>{s.role}</span>
                      <span>{s.duration}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Detailed Card */}
            {(() => {
              const currentStepData =
                LIFECYCLE_STEPS.find((s) => s.step === activeLifecycleStep) || LIFECYCLE_STEPS[0];
              const StepIcon = currentStepData.icon;

              return (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <StepIcon className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[11px] font-black uppercase bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                            Stage {currentStepData.step} of 6
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            Responsible: <strong className="text-slate-800">{currentStepData.role}</strong>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500">Estimated Duration: {currentStepData.duration}</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                          {currentStepData.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                          {currentStepData.summary}
                        </p>
                      </div>
                    </div>

                    {/* Action Deep Link */}
                    <div className="shrink-0 flex items-center gap-2">
                      <Link
                        href={currentStepData.route}
                        className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>Open {currentStepData.title.split(" ")[0]} Console</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Prerequisites & Action Items Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
                    {/* Left 2 Cols: Step by Step Action Checklist */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        <span>Execution Checklist &amp; Operational Flow</span>
                      </h3>
                      <div className="space-y-2.5">
                        {currentStepData.actionItems.map((action, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-700 font-medium"
                          >
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{action}</span>
                          </div>
                        ))}
                      </div>

                      {/* Best Practice Tip Box */}
                      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 mt-4">
                        <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Institutional Recommendation</span>
                          <span className="text-amber-800 text-[11px] leading-relaxed mt-0.5 block">
                            {currentStepData.quickTip}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right 1 Col: Stage Metadata & Navigation */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                          Prerequisites &amp; Gates
                        </span>
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block mb-1">Required Ahead:</span>
                          <span className="text-[11px] text-slate-600 leading-relaxed">
                            {currentStepData.prerequisites}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                          <span className="font-bold text-slate-900 block">Next Milestone:</span>
                          <span className="text-[11px] text-purple-700 font-bold block">
                            {currentStepData.step < 6
                              ? `Step 0${currentStepData.step + 1}: ${LIFECYCLE_STEPS[currentStepData.step].title}`
                              : "Examination Completed & Moderated"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                        <button
                          type="button"
                          disabled={currentStepData.step === 1}
                          onClick={() => setActiveLifecycleStep((prev) => Math.max(1, prev - 1))}
                          className="text-xs font-bold text-slate-600 hover:text-purple-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        >
                          ← Previous Step
                        </button>
                        <button
                          type="button"
                          disabled={currentStepData.step === 6}
                          onClick={() => setActiveLifecycleStep((prev) => Math.min(6, prev + 1))}
                          className="text-xs font-bold text-purple-700 hover:text-purple-900 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Next Step →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Architecture Flow Diagram */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    SafeExam Pro System Telemetry &amp; Security Pipeline
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    How data flows securely from question authoring to locked browser testing and live proctoring.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Encrypted Zero-Trust Architecture</span>
                </div>
              </div>

              {/* Visual Pipeline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center text-xs font-black">
                    1
                  </div>
                  <div className="font-bold text-xs text-purple-950">Blueprint &amp; Question Banks</div>
                  <p className="text-[11px] text-purple-900/80 leading-relaxed">
                    Examiners draft sections, marks, and formulas in PostgreSQL with row-level security.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center text-xs font-black">
                    2
                  </div>
                  <div className="font-bold text-xs text-indigo-950">Lockdown Candidate Hall</div>
                  <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                    Browser locks into fullscreen, monitors window blur, clipboard, and captures live webcam video.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xs font-black">
                    3
                  </div>
                  <div className="font-bold text-xs text-amber-950">Live Proctor Surveillance</div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    Granular telemetry dispatches instant Fullscreen vs Tab Switch incidents with risk scoring.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xs font-black">
                    4
                  </div>
                  <div className="font-bold text-xs text-emerald-950">Moderation &amp; Publishing</div>
                  <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                    Automated MCQ scoring + percentile ranking with audit logs and official candidate scorecards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MODULE DEEP DIVES
        ========================================================================== */}
        {activeTab === "modules" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
            {/* Left Module Directory Selector */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2 mb-1">
                System Capabilities Directory
              </span>
              {filteredModules.map((mod, idx) => {
                const Icon = mod.icon;
                const isSelected = activeModuleIndex === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveModuleIndex(idx)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? "bg-purple-50 text-purple-900 border-purple-300 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-purple-700 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-slate-900 truncate block">
                          {mod.title}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                          {mod.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Module Detailed Documentation View */}
            <div className="lg:col-span-8">
              {(() => {
                const currentModule = filteredModules[activeModuleIndex] || filteredModules[0];
                const ModIcon = currentModule.icon;

                return (
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                          <ModIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                              {currentModule.badge}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              Route: {currentModule.route}
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                            {currentModule.title}
                          </h2>
                        </div>
                      </div>

                      <Link
                        href={currentModule.route}
                        className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                      >
                        <span>Open Module</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {currentModule.description}
                    </p>

                    <div className="space-y-4 pt-2">
                      {currentModule.sections.map((sec, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1.5"
                        >
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-600" />
                            <span>{sec.heading}</span>
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed pl-4">
                            {sec.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: INTERACTIVE TELEMETRY & ANTI-CHEAT SIMULATOR
        ========================================================================== */}
        {activeTab === "simulator" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-extrabold uppercase mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Live Anti-Cheat Simulator</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Interactive Surveillance Telemetry Demonstration
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                    Test how student infractions propagate in real-time across the Candidate Screen, Proctor Feed, and Admin Roster.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSimFullscreenExits(0);
                    setSimTabSwitches(0);
                    setSimProctorWarning(null);
                    setSimTerminated(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer shrink-0 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Simulator State</span>
                </button>
              </div>

              {/* Interactive Control Trigger Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setSimFullscreenExits((prev) => prev + 1)}
                  className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-900 font-bold text-xs text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                      Trigger
                    </span>
                    <Maximize2 className="w-4 h-4 text-rose-700" />
                  </div>
                  <span>+1 Fullscreen Exit</span>
                  <span className="text-[10px] text-rose-700 font-normal mt-1 block">
                    Esc / F11 perimeter breach
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimTabSwitches((prev) => prev + 1)}
                  className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-bold text-xs text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                      Trigger
                    </span>
                    <MonitorOff className="w-4 h-4 text-amber-700" />
                  </div>
                  <span>+1 Tab / Window Switch</span>
                  <span className="text-[10px] text-amber-700 font-normal mt-1 block">
                    Alt+Tab / Window Blur
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSimProctorWarning(
                      "Warning: Continuous face deviation detected. Please focus strictly on the exam screen."
                    )
                  }
                  className="p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-900 font-bold text-xs text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-200 text-indigo-900">
                      Proctor Action
                    </span>
                    <Send className="w-4 h-4 text-indigo-700" />
                  </div>
                  <span>Send Direct Warning</span>
                  <span className="text-[10px] text-indigo-700 font-normal mt-1 block">
                    Interrupt candidate screen
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimTerminated((prev) => !prev)}
                  className={`p-4 rounded-2xl border font-bold text-xs text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between ${
                    simTerminated
                      ? "bg-red-700 text-white border-red-800"
                      : "bg-red-50 hover:bg-red-100/80 border-red-200 text-red-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        simTerminated
                          ? "bg-red-900 text-white"
                          : "bg-red-200 text-red-900"
                      }`}
                    >
                      Override
                    </span>
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <span>{simTerminated ? "Session Terminated" : "Terminate Session"}</span>
                  <span
                    className={`text-[10px] font-normal mt-1 block ${
                      simTerminated ? "text-red-100" : "text-red-700"
                    }`}
                  >
                    Disqualify test attempt
                  </span>
                </button>
              </div>

              {/* Visual Simulated Mockups Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                {/* 1. Candidate View Mockup */}
                <div className="bg-slate-900 rounded-3xl p-5 text-white space-y-4 border border-slate-800 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      Candidate Screen (CBT Hall)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  {simTerminated ? (
                    <div className="p-6 rounded-2xl bg-red-950/80 border border-red-800 text-center space-y-3">
                      <XCircle className="w-8 h-8 text-red-500 mx-auto" />
                      <div className="font-black text-sm text-white">Examination Terminated</div>
                      <p className="text-[11px] text-red-300">
                        Disqualified by Chief Invigilator for repeated anti-cheat violations.
                      </p>
                    </div>
                  ) : simProctorWarning ? (
                    <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500 text-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Official Proctor Warning</span>
                      </div>
                      <p className="text-[11px] text-white leading-relaxed">{simProctorWarning}</p>
                      <button
                        onClick={() => setSimProctorWarning(null)}
                        className="w-full py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] uppercase cursor-pointer"
                      >
                        I Acknowledge
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs bg-slate-800/80 px-3 py-2 rounded-xl">
                        <span className="font-semibold text-slate-300">Header Telemetry:</span>
                        <div className="flex items-center gap-1.5">
                          {simFullscreenExits > 0 && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500/30 border border-rose-400 text-rose-300">
                              🖥️ {simFullscreenExits} FS
                            </span>
                          )}
                          {simTabSwitches > 0 && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/30 border border-amber-400 text-amber-300">
                              🔄 {simTabSwitches} Tab
                            </span>
                          )}
                          {simFullscreenExits === 0 && simTabSwitches === 0 && (
                            <span className="text-[10px] text-emerald-400 font-bold">✓ Secure</span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center space-y-2">
                        <div className="text-xs font-bold text-slate-200">Question 04: Computational Complexity</div>
                        <p className="text-[11px] text-slate-400">
                          What is the tight upper bound of Matrix Multiplication algorithm?
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 text-center pt-2">
                    Candidate: Priya Sharma (Roll: PH26-081)
                  </div>
                </div>

                {/* 2. Live Proctor Hub Stream Mockup */}
                <div className="bg-white rounded-3xl p-5 text-slate-900 space-y-4 border border-slate-200 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      Live Proctor Stream Feed
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Video
                    </span>
                  </div>

                  {/* Simulated Camera Video Box */}
                  <div className="aspect-video bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                    <Video className="w-8 h-8 text-slate-300" />
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">Webcam 720p Stream</span>

                    {/* Stream Anomaly Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {simFullscreenExits > 0 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-600 text-white shadow-xs">
                          {simFullscreenExits} FS
                        </span>
                      )}
                      {simTabSwitches > 0 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-white shadow-xs">
                          {simTabSwitches} Tab
                        </span>
                      )}
                    </div>

                    {/* Risk Badge */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          simFullscreenExits * 25 + simTabSwitches * 20 >= 60
                            ? "bg-red-600 text-white"
                            : simFullscreenExits + simTabSwitches > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        Risk: {Math.min(100, simFullscreenExits * 25 + simTabSwitches * 20)}/100
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-slate-800">Priya Sharma</span>
                    <span className="text-[10px] text-slate-400 font-mono">CSE Department</span>
                  </div>
                </div>

                {/* 3. Admin Roster Dossier Row Mockup */}
                <div className="bg-white rounded-3xl p-5 text-slate-900 space-y-4 border border-slate-200 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                        Admin Candidate Roster Entry
                      </span>
                      <span className="text-[10px] font-mono text-purple-700 font-bold">/admin/students</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="font-bold text-xs text-slate-900">Priya Sharma</div>
                      <div className="text-[11px] text-slate-500">priya.sharma@university.edu</div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                        {simFullscreenExits > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700">
                            🖥️ {simFullscreenExits} FS
                          </span>
                        )}
                        {simTabSwitches > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                            🔄 {simTabSwitches} Tab
                          </span>
                        )}
                        {simFullscreenExits === 0 && simTabSwitches === 0 && (
                          <span className="text-[10px] text-slate-400">0 Flags Logged</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    Status:{" "}
                    <strong className={simTerminated ? "text-red-700" : "text-emerald-700"}>
                      {simTerminated ? "Terminated by Invigilator" : "In Progress"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: PRE-EXAM READINESS CHECKLIST
        ========================================================================== */}
        {activeTab === "checklist" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-extrabold uppercase mb-2">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Institutional Pre-Flight Audit</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  University Exam Readiness Scorecard
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                  Complete this operational checklist before opening examination gates to ensure full security compliance.
                </p>
              </div>

              {/* Score Meter */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shrink-0 min-w-[160px]">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Readiness Score
                </span>
                <span
                  className={`text-3xl font-black ${
                    checklistScore >= 80
                      ? "text-emerald-700"
                      : checklistScore >= 50
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                >
                  {checklistScore}%
                </span>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      checklistScore >= 80
                        ? "bg-emerald-500"
                        : checklistScore >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${checklistScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  id: "departments",
                  title: "1. Academic Departments Configured",
                  desc: "Departments and department codes are provisioned in PostgreSQL.",
                  route: "/admin/departments",
                },
                {
                  id: "faculty",
                  title: "2. Examiner & Faculty Roles Delegated",
                  desc: "At least one active examiner is assigned to manage blueprints.",
                  route: "/admin/users",
                },
                {
                  id: "candidates",
                  title: "3. Candidate Entrance Registry Enrolled",
                  desc: "Ph.D candidates imported and login credentials provisioned.",
                  route: "/admin/students",
                },
                {
                  id: "exams",
                  title: "4. Exam Blueprints & Sections Approved",
                  desc: "Blueprint pass criteria, negative marking, and question quotas validated.",
                  route: "/examiner/exams",
                },
                {
                  id: "schedules",
                  title: "5. Official Examination Window Scheduled",
                  desc: "Time slots configured with auto-generated candidate allocations.",
                  route: "/examiner/schedules",
                },
                {
                  id: "proctors",
                  title: "6. Proctors Allocated for Active Supervisions",
                  desc: "Invigilators assigned to supervise active candidate webcam feeds.",
                  route: "/proctor",
                },
                {
                  id: "lockdownVerified",
                  title: "7. Fullscreen & Tab Blur Lockdown Active",
                  desc: "Perimeter anti-cheat listeners tested and verified on modern browsers.",
                  route: "/admin/docs",
                },
                {
                  id: "browserPolicy",
                  title: "8. Institutional Identity & Header Branding Set",
                  desc: "University name and administrative contact info set in Settings.",
                  route: "/admin/settings",
                },
              ].map((item) => {
                const isChecked = Boolean(checklist[item.id]);

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                      isChecked
                        ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-950"
                        : "bg-slate-50/50 border-slate-200/80 text-slate-700 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 block truncate">
                          {item.title}
                        </span>
                        <Link
                          href={item.route}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-purple-700 hover:text-purple-900 font-bold shrink-0 underline"
                        >
                          Verify
                        </Link>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: RBAC & PERMISSION MATRIX
        ========================================================================== */}
        {activeTab === "rbac" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="pb-6 border-b border-slate-100">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-extrabold uppercase mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero-Trust Role-Based Access Control</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Institutional Security &amp; Permission Architecture
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                SafeExam Pro strictly enforces 5 role tiers in PostgreSQL RLS policies. Single university deployment without multi-tenancy overhead.
              </p>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">System Capability</th>
                    <th className="py-3 px-3 text-center text-purple-700">Admin</th>
                    <th className="py-3 px-3 text-center text-indigo-700">Examiner</th>
                    <th className="py-3 px-3 text-center text-emerald-700">Proctor</th>
                    <th className="py-3 px-3 text-center text-slate-700">Candidate</th>
                    <th className="py-3 px-3 text-center text-slate-500">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {[
                    { cap: "Department & University Settings", admin: true, examiner: false, proctor: false, candidate: false, viewer: false },
                    { cap: "User & Faculty Provisioning", admin: true, examiner: false, proctor: false, candidate: false, viewer: false },
                    { cap: "Candidate Roster Enrollment", admin: true, examiner: false, proctor: false, candidate: false, viewer: false },
                    { cap: "Exam Blueprint Authoring", admin: true, examiner: true, proctor: false, candidate: false, viewer: false },
                    { cap: "Question Bank Authoring & AI Prompts", admin: true, examiner: true, proctor: false, candidate: false, viewer: false },
                    { cap: "Exam Window Scheduling", admin: true, examiner: true, proctor: false, candidate: false, viewer: false },
                    { cap: "Live Webcam Video Surveillance", admin: true, examiner: false, proctor: true, candidate: false, viewer: false },
                    { cap: "Send Live Warning To Candidate", admin: true, examiner: false, proctor: true, candidate: false, viewer: false },
                    { cap: "Emergency Session Termination", admin: true, examiner: false, proctor: true, candidate: false, viewer: false },
                    { cap: "Scorecard Moderation & Publishing", admin: true, examiner: true, proctor: false, candidate: false, viewer: false },
                    { cap: "Take Assigned Examination", admin: false, examiner: false, proctor: false, candidate: true, viewer: false },
                    { cap: "View Own Released Scorecards", admin: false, examiner: false, proctor: false, candidate: true, viewer: false },
                    { cap: "Audit Log Inspection", admin: true, examiner: false, proctor: false, candidate: false, viewer: true },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.cap}</td>
                      <td className="py-3 px-3 text-center">
                        {row.admin ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">✓ Full</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.examiner ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">✓ Yes</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.proctor ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">✓ Yes</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.candidate ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">✓ Own</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.viewer ? (
                          <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">Read Only</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: EMERGENCY PLAYBOOK & FAQS
        ========================================================================== */}
        {activeTab === "troubleshooting" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="pb-6 border-b border-slate-100">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-extrabold uppercase mb-2">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Operations &amp; Emergency Protocols</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Frequently Asked Questions &amp; Troubleshooting Playbook
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                  Step-by-step resolution guides for handling rare hardware glitches, candidate disconnections, and invigilation protocols.
                </p>
              </div>

              <div className="space-y-4">
                {TROUBLESHOOTING_FAQS.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2"
                  >
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-lg bg-purple-100 text-purple-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        Q
                      </span>
                      <span>{faq.q}</span>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed pl-7">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
