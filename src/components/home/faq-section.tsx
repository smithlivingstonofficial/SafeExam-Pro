"use client";

import { useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  Mail,
  Phone,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface FaqSectionProps {
  universityName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  lockdownRequired: boolean;
  autoSaveSeconds: number;
}

export function FaqSection({
  universityName,
  contactEmail,
  contactPhone,
  lockdownRequired,
  autoSaveSeconds,
}: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What happens if my internet connection drops during an exam?",
      answer: `SafeExam Pro features a zero-data-loss architecture. Every answer is cached locally in an encrypted buffer in your browser/lockdown client and automatically re-synced every ${autoSaveSeconds} seconds. Even if the network drops completely, your exam timer continues safely, and all unsaved answers are automatically synchronized as soon as the connection is restored.`,
    },
    {
      question: `Is the SafeExam Lockdown Browser mandatory for all examinations at ${universityName}?`,
      answer: lockdownRequired
        ? `Yes. For high-stakes entrance and degree evaluations at ${universityName}, candidates must launch the exam via the SafeExam Lockdown Client. It disables secondary monitors, blocks screen recording and application switching (Alt+Tab, Cmd+Space), and ensures an isolated, cheat-proof environment.`
        : `SafeExam Pro supports both standard modern browsers (with full-screen enforcement and tab-blur detection) and our dedicated Lockdown Client. Please check your specific exam admit card instructions for requirements.`,
    },
    {
      question: "How does the AI and human proctoring system evaluate anomalies?",
      answer: "The platform analyzes continuous video and audio telemetry to verify face presence, gaze alignment, and background acoustic noise. The AI flags potential anomalies—such as multiple faces, absence from frame, or sudden volume spikes—in real time. These flags are reviewed live by human faculty proctors who can issue warnings or take disciplinary action before terminating any session.",
    },
    {
      question: "What computer specifications and devices are supported?",
      answer: "SafeExam Pro is optimized for desktop and laptop computers running modern versions of Windows (10/11), macOS (11+), or standard Linux distributions. An integrated or external webcam, working microphone, and a minimum screen resolution of 1280x720 are required. Mobile devices and tablets are not supported for high-stakes evaluations.",
    },
    {
      question: "How does the candidate pre-flight system check work?",
      answer: "Candidates can run the interactive diagnostic scan directly on this landing page at any time before the examination. The scan verifies your browser compatibility, full-screen API support, camera/mic permissions, and measures live roundtrip network latency directly to our university exam servers.",
    },
    {
      question: "When and how are examination results announced?",
      answer: `Following the conclusion of the evaluation window and faculty verification of proctoring audit logs, verified scorecards are published through the Candidate Lobby portal. Candidates receive email notifications at their registered university email address with access credentials.`,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
          Candidate & Faculty Support
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Clear answers regarding exam protocols, hardware compatibility, proctoring policies, and data security.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-white border-blue-300 ring-2 ring-blue-500/10 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-extrabold shrink-0">
                    Q{index + 1}
                  </span>
                  <span>{faq.question}</span>
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180 text-blue-600" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Helpdesk Callout Card */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 rounded-2xl p-6 sm:p-8 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              Need assistance before your examination?
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              The {universityName} Examination Support Desk is online during all scheduled exam sessions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Support</span>
            </a>
          )}
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Helpline</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
