---
name: safeexam-pro
description: >-
  Use this skill whenever working on the SafeExam Pro project — the secure entrance
  exam platform for a single university. Covers project architecture, tech stack
  (Next.js, Supabase, Vercel, Cloudflare), database schema, RBAC roles, module
  structure, naming conventions, and development phases. Activate when creating,
  modifying, or debugging any part of the exam platform codebase.
---

# SafeExam Pro — Project Skill

## Quick Reference

| Aspect | Detail |
|---|---|
| **Product** | SafeExam Pro — Single-university secure exam platform |
| **Scope** | Single university deployment (NO multi-tenancy) |
| **Tech Stack** | Next.js 14+ (App Router), Supabase, Vercel, Cloudflare |
| **UI** | shadcn/ui + Radix UI + Tailwind CSS v4 |
| **State** | Zustand (client), React Server Components (server) |
| **Forms** | React Hook Form + Zod |
| **Testing** | Vitest, Playwright, Testing Library |
| **Safe Browser** | Electron (Phase 5) |

---

## Architecture Rules

1. **Single-university**: There is NO multi-tenancy. No `org_id` column. No tenant isolation. One deployment = one university.
2. **RBAC**: 5 roles — `admin`, `examiner`, `proctor`, `candidate`, `viewer`. Check permissions server-side.
3. **RLS**: Row-Level Security is **role-based** (not org-based). Policies check `auth.uid()` and the user's role from `profiles`.
4. **API Routes**: Use Next.js Route Handlers (`app/api/`). Validate ALL inputs with Zod schemas.
5. **Auth**: Supabase Auth with JWT. Use `@supabase/ssr` for server-side auth in Next.js.
6. **Realtime**: Supabase Realtime for exam auto-save, proctoring flags, notifications.
7. **Storage**: Supabase Storage for media. Buckets: `university-assets`, `question-media`, `proctoring-recordings`, `reports`, `imports`.
8. **Audit**: Every mutating operation MUST write to `audit_logs`.

---

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files/Folders | kebab-case | `exam-composer.tsx` |
| Components | PascalCase | `ExamComposer` |
| Hooks | camelCase + `use` prefix | `useExamSession` |
| DB Tables | snake_case plural | `exam_schedules` |
| DB Columns | snake_case | `created_at` |
| API Routes | kebab-case | `/api/exam-results` |
| Env Vars | SCREAMING_SNAKE_CASE | `SUPABASE_SERVICE_ROLE_KEY` |
| Types | PascalCase | `ExamSchedule` |

---

## Core Database Tables

```
university_settings, profiles, departments, question_banks, questions,
exams, exam_sections, exam_section_questions, exam_schedules,
exam_assignments, exam_responses, exam_results, proctoring_sessions,
audit_logs, notifications
```

Every mutation MUST write to `audit_logs` with: `user_id`, `action`, `entity_type`, `entity_id`, `details (jsonb)`, `ip_address`.

---

## Key Modules

1. **Auth & User Management** — Supabase Auth, role-based RLS
2. **University Settings** — Profile, departments, exam policies
3. **Question Bank** — CRUD, rich editor (TipTap + KaTeX), import/export
4. **Exam Composer** — Sections, marking schemes, shuffling, templates
5. **Scheduling** — Timezone-aware, fixed/flexible windows, assignments
6. **Exam Engine** — Timer, auto-save, anti-cheat, connection recovery
7. **Safe Browser** — Electron lockdown (Phase 5)
8. **Proctoring** — WebRTC via LiveKit, AI detection, recordings
9. **Results** — Auto-grading, manual review, analytics, PDF export
10. **Audit** — Immutable logs, compliance tools
11. **Notifications** — Email (Resend), in-app (Realtime)

---

## Security Checklist

- [ ] RLS enabled on ALL tables (role-based policies)
- [ ] Zod validation on ALL API inputs
- [ ] Rate limiting via Cloudflare WAF + Vercel middleware
- [ ] CSP headers configured
- [ ] Service role key NEVER exposed to client
- [ ] CORS restricted to known origins
- [ ] Audit log for every destructive action

---

## File Structure (App Router)

```
app/
  (public)/          → Landing, login, register
  (dashboard)/       → Admin/examiner/proctor dashboard (authenticated)
  (exam)/            → Candidate exam-taking (minimal UI)
  api/               → Route handlers
lib/
  supabase/          → Client + server Supabase helpers
  utils/             → Shared utilities
  validations/       → Zod schemas
  hooks/             → Custom React hooks
  types/             → TypeScript type definitions
components/
  ui/                → shadcn/ui components
  dashboard/         → Dashboard-specific components
  exam/              → Exam-related components
  questions/         → Question bank components
```

---

## Development Phases

| Phase | Focus | Weeks |
|---|---|---|
| 1 | Foundation (Auth, RBAC, UI shell, University settings) | 1–3 |
| 2 | Exam Management (Questions, Composer, Scheduling) | 4–7 |
| 3 | Exam Engine (Candidate portal, Timer, Anti-cheat) | 8–11 |
| 4 | Proctoring (WebRTC, AI, Monitoring) | 12–15 |
| 5 | Safe Browser (Electron) | 16–20 |
| 6 | Analytics, Audit & Polish | 21–22 |

---

## Full Master Plan

For the complete detailed plan with database schemas, API routes, and configurations, see:
[exam_platform_master_plan.md](./references/exam_platform_master_plan.md)
