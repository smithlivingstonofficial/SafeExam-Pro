# 🛡️ SafeExam Pro — Master Plan (v2)

> A secure exam management platform for a single university — with a lockdown browser, full proctoring, and complete administrative control.

---

## 1. Product Vision

**SafeExam Pro** is a university-owned platform for conducting secure entrance examinations. It enables the university to:

- **Create & manage** question banks, exams, and schedules
- **Assign** exams to candidates with fine-grained access control
- **Conduct** exams inside a **Safe/Lockdown Browser** that prevents cheating
- **Proctor** exams in real-time with AI-assisted anomaly detection
- **Audit** every action with tamper-proof logs
- **Analyse** results with rich dashboards and exportable reports

> [!NOTE]
> This is a **single-university** deployment. There is no multi-tenancy, no org isolation, and no billing/subscription system. One instance = one university.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) | SSR/SSG pages, React Server Components, API routes |
| **Backend/BaaS** | Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions) | Database, authentication, real-time subscriptions, file storage |
| **Hosting** | Vercel | Frontend deployment, serverless functions, edge middleware |
| **CDN / Security** | Cloudflare | DDoS protection, WAF, DNS, page rules, bot management |
| **Safe Browser** | Electron (Phase 5) | Lockdown desktop client for candidates |
| **UI** | shadcn/ui + Radix UI + Tailwind CSS v4 | Component library |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                             │
│   DNS  ·  WAF  ·  DDoS  ·  CDN  ·  Bot Management         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                       VERCEL                                │
│  Next.js App Router  ·  Edge Middleware  ·  API Routes      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Admin    │ │ Exam     │ │ Candidate│ │ Public   │       │
│  │Dashboard │ │ Engine   │ │ Portal   │ │ Landing  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      SUPABASE                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ PostgreSQL │ │ Auth       │ │ Realtime   │              │
│  │ (RLS)      │ │ (JWT/OAuth)│ │ (WebSocket)│              │
│  └────────────┘ └────────────┘ └────────────┘              │
│  ┌────────────┐ ┌────────────┐                              │
│  │ Storage    │ │ Edge Funcs │                              │
│  │ (Media)    │ │ (Hooks)    │                              │
│  └────────────┘ └────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. User Roles & Permissions (RBAC)

| Role | Key Capabilities |
|---|---|
| **Admin** | Full platform control — manage users, exams, questions, settings, view audit logs, analytics |
| **Examiner** | Create/edit questions, compose exams, schedule exams, view results |
| **Proctor** | Monitor live exam sessions, flag candidates, pause/terminate exams |
| **Candidate** | Register, take exams, view own results |
| **Viewer** | Read-only access to results, analytics, and audit logs |

---

## 5. Module Breakdown

### 5.1 🔐 Authentication & User Management

| Feature | Details |
|---|---|
| Sign-up / Login | Email+Password, Magic Link, Google OAuth |
| Session management | JWT tokens, refresh token rotation, device fingerprinting |
| 2FA | TOTP-based two-factor authentication for admin/examiner roles |
| User management | Admin can create/invite users, assign roles, activate/deactivate |
| Profile | Full name, avatar, department, contact info |

### 5.2 🏛️ University Settings

| Feature | Details |
|---|---|
| University profile | Name, logo, contact info, address |
| Departments | Department list for organizing exams and candidates |
| Exam policies | Default proctoring level, time limits, anti-cheat settings |
| Notification preferences | Email templates, reminder intervals |

### 5.3 📚 Question Bank

| Feature | Details |
|---|---|
| Question types | MCQ (single/multi), True/False, Fill-in-the-blank, Numerical, Descriptive, Coding |
| Rich content | LaTeX math, images, audio clips, code snippets (syntax highlighted) |
| Metadata | Subject, topic, sub-topic, difficulty (1-5), Bloom's taxonomy level |
| Tagging & search | Full-text search, filter by tags, bulk operations |
| Import / Export | CSV, Excel, JSON format import & export |
| Versioning | Question revision history with diff view |
| Shared pools | Cross-examiner shared question pools |

### 5.4 📝 Exam Composer

| Feature | Details |
|---|---|
| Manual selection | Pick questions from bank, drag-and-drop ordering |
| Auto-generation | Rule-based: "10 MCQs from Physics/Mechanics, difficulty 3-5" |
| Sections | Multi-section exams with per-section time limits |
| Marking scheme | Positive marks, negative marks, partial marking |
| Question shuffling | Per-candidate randomized question & option order |
| Exam sets | Multiple variants (Set A, B, C) from the same pool |
| Preview | Full exam preview as candidate would see it |
| Templates | Save exam structures as reusable templates |

### 5.5 📅 Exam Scheduling & Assignment

| Feature | Details |
|---|---|
| Scheduling | Start datetime, end datetime, duration, timezone-aware |
| Windows | Fixed window (all start together) vs flexible window (start anytime within range) |
| Candidate assignment | Individual, bulk CSV upload, department-based |
| Registration | Self-registration with approval workflow, or admin-assigned |
| Notifications | Email + in-app reminders at configurable intervals |
| Seat management | Max concurrent candidates, waitlist support |
| Rescheduling | Admin can reschedule with automatic candidate notification |

### 5.6 🖥️ Exam Execution Engine

| Feature | Details |
|---|---|
| Candidate dashboard | Upcoming exams, instructions, system check |
| System check | Browser compatibility, webcam/mic test, internet speed |
| Safe browser enforcement | Detect if running in safe browser, block otherwise |
| Timer | Server-synced countdown, auto-submit on expiry |
| Navigation | Question palette, flag for review, section navigation |
| Auto-save | Answers auto-saved every 30 seconds to Supabase |
| Pause/Resume | Proctor-initiated pause with frozen timer |
| Connection handling | Offline queue, reconnection with state restoration |
| Anti-cheat (web) | Tab switch detection, copy/paste block, right-click disable, fullscreen enforcement |

### 5.7 🔒 Safe Browser (Electron — Phase 5)

| Feature | Details |
|---|---|
| Lockdown mode | Disable Alt+Tab, Task Manager, screen capture, clipboard |
| Kiosk mode | Fullscreen-only, no address bar, no dev tools |
| Allowed processes | Whitelist only the exam browser process |
| System monitoring | Detect VMs, remote desktop, screen sharing tools |
| Heartbeat | Regular pings to server confirming secure state |
| Auto-update | Silent updates via Electron auto-updater |
| Platform support | Windows 10/11, macOS, Ubuntu/Debian Linux |

### 5.8 👁️ Proctoring System

| Feature | Details |
|---|---|
| Live monitoring | Real-time video/audio feed from candidates (WebRTC) |
| AI proctoring | Face detection (multiple faces), gaze tracking, object detection |
| Screen recording | Optional screen capture during exam |
| Incident flags | Automated flags for suspicious activity |
| Manual review | Proctor can flag, warn, or terminate a candidate |
| Chat | Proctor ↔ Candidate text chat for queries |
| Proctoring levels | None, Basic (tab detection), Standard (webcam), Full (webcam + screen + AI) |
| Recording storage | Supabase Storage with retention policies |

### 5.9 📊 Results & Analytics

| Feature | Details |
|---|---|
| Auto-grading | Instant for objective questions |
| Manual grading | UI for grading descriptive answers with rubrics |
| Score calculation | Weighted sections, normalization, percentile ranking |
| Result publishing | Draft → Review → Published workflow |
| Candidate report | Score breakdown by section/topic, performance radar chart |
| University analytics | Pass rates, difficulty analysis, question discrimination index |
| Comparison | Cohort comparison, trend analysis across exam sessions |
| Export | PDF certificates, Excel reports |

### 5.10 📋 Audit & Compliance

| Feature | Details |
|---|---|
| Action logging | Every CRUD operation logged with user, timestamp, IP, device |
| Exam session log | Complete timeline: login → each answer → submit |
| Proctoring log | All flags, warnings, terminations with evidence |
| Immutable logs | Append-only audit table, no soft deletes |
| Data retention | Configurable retention periods |
| Reporting | Filterable audit log viewer, exportable reports |

### 5.11 🔔 Notifications

| Feature | Details |
|---|---|
| Email | Transactional emails via Resend |
| In-app | Real-time notifications via Supabase Realtime |
| Templates | Customizable email/notification templates |

---

## 6. Database Schema (Core Entities)

```
university_settings
├── id (uuid, PK)
├── name, logo_url, address
├── contact_email, contact_phone
└── settings (jsonb — exam policies, defaults)

profiles (extends auth.users)
├── id (uuid, PK, FK → auth.users)
├── role (enum: admin, examiner, proctor, candidate, viewer)
├── full_name, avatar_url, phone
├── department
├── is_active (boolean)
└── metadata (jsonb)

departments
├── id, name, head_name

question_banks
├── id, name, description, created_by

questions
├── id, bank_id, created_by
├── type (enum), content (jsonb), options (jsonb)
├── correct_answer (jsonb), explanation
├── subject, topic, sub_topic
├── difficulty, bloom_level
├── tags (text[]), version
└── media_urls (text[])

exams
├── id, created_by
├── title, description, instructions
├── status (draft/published/archived)
└── settings (jsonb: shuffle, negative_marks, etc.)

exam_sections
├── id, exam_id, title, order
├── time_limit_minutes, marking_scheme (jsonb)
└── question_selection_rules (jsonb)

exam_section_questions
├── id, section_id, question_id, order, marks

exam_schedules
├── id, exam_id
├── start_at, end_at, duration_minutes
├── window_type (fixed/flexible)
├── max_candidates, proctoring_level
└── status (scheduled/active/completed/cancelled)

exam_assignments
├── id, schedule_id, candidate_id
├── status (assigned/started/submitted/graded/absent)
├── assigned_at, started_at, submitted_at

exam_responses
├── id, assignment_id, question_id
├── response (jsonb), is_flagged
├── time_spent_seconds, saved_at

exam_results
├── id, assignment_id
├── total_score, max_score, percentage, percentile
├── section_scores (jsonb)
├── status (draft/reviewed/published)
└── graded_by, graded_at

proctoring_sessions
├── id, assignment_id
├── recording_url, screenshots (jsonb)
├── flags (jsonb[]), risk_score
└── proctor_notes

audit_logs
├── id, user_id
├── action (text), entity_type, entity_id
├── details (jsonb), ip_address, user_agent
└── created_at (timestamptz)

notifications
├── id, user_id
├── type, title, body
├── read_at, action_url
└── created_at
```

---

## 7. API Routes Structure (Next.js App Router)

```
app/
├── (public)/
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Login
│   └── register/page.tsx           # Candidate self-registration
│
├── (dashboard)/                    # Authenticated layout
│   ├── layout.tsx                  # Sidebar + topbar shell
│   ├── dashboard/page.tsx          # Role-based home
│   │
│   ├── settings/
│   │   ├── page.tsx                # University settings
│   │   └── members/page.tsx        # User management
│   │
│   ├── questions/
│   │   ├── page.tsx                # Question bank list
│   │   ├── banks/[bankId]/page.tsx # Bank detail
│   │   ├── create/page.tsx         # Create question
│   │   ├── [questionId]/page.tsx   # Edit question
│   │   └── import/page.tsx         # Bulk import
│   │
│   ├── exams/
│   │   ├── page.tsx                # Exam list
│   │   ├── create/page.tsx         # Exam composer
│   │   ├── [examId]/
│   │   │   ├── page.tsx            # Exam detail
│   │   │   ├── edit/page.tsx       # Edit exam
│   │   │   ├── schedule/page.tsx   # Schedule & assign
│   │   │   ├── monitor/page.tsx    # Live proctoring
│   │   │   └── results/page.tsx    # Results & analytics
│   │   └── templates/page.tsx      # Exam templates
│   │
│   ├── candidates/
│   │   ├── page.tsx                # Candidate roster
│   │   ├── [candidateId]/page.tsx  # Candidate profile
│   │   └── import/page.tsx         # Bulk import
│   │
│   ├── analytics/
│   │   ├── page.tsx                # Overview dashboard
│   │   ├── exams/page.tsx          # Exam analytics
│   │   └── questions/page.tsx      # Question analytics
│   │
│   └── audit/
│       └── page.tsx                # Audit log viewer
│
├── (exam)/                         # Candidate exam-taking layout
│   ├── layout.tsx                  # Minimal, distraction-free
│   ├── lobby/[scheduleId]/page.tsx # Pre-exam: instructions, system check
│   └── take/[assignmentId]/page.tsx# Exam interface
│
└── api/
    ├── auth/                       # Auth callbacks
    ├── exams/                      # Exam CRUD
    ├── questions/                  # Question CRUD
    ├── submissions/                # Answer submission
    ├── proctoring/                 # Proctoring webhooks
    ├── webhooks/                   # Supabase webhooks
    └── cron/                       # Scheduled tasks (Vercel cron)
```

---

## 8. Supabase Configuration

### Row-Level Security (RLS) Strategy

Since this is a single-university deployment, RLS policies are **role-based** (not org-based):

```sql
-- Admins can do everything
CREATE POLICY "admin_full_access" ON questions
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Examiners can manage their own questions
CREATE POLICY "examiner_own_questions" ON questions
  FOR ALL USING (
    created_by = auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'examiner'
  );

-- Candidates cannot see questions directly
CREATE POLICY "candidates_no_direct_access" ON questions
  FOR SELECT USING (false);
```

### Realtime Subscriptions

- **Exam session**: Candidate answers auto-sync
- **Proctoring**: Live flag updates for proctors
- **Notifications**: Instant in-app delivery
- **Monitoring dashboard**: Active candidate count, progress

### Edge Functions

- `calculate-results`: Post-exam score computation
- `send-notification`: Email/push notification dispatch
- `generate-report`: PDF report generation
- `proctor-ai-analyze`: Frame analysis for AI proctoring

### Storage Buckets

| Bucket | Purpose | Access |
|---|---|---|
| `university-assets` | Logo, branding materials | Public (CDN) |
| `question-media` | Images/audio in questions | Authenticated (admin/examiner) |
| `proctoring-recordings` | Webcam/screen recordings | Admin only |
| `reports` | Generated PDF reports | Per-user |
| `imports` | Uploaded CSV/Excel files | Admin/Examiner |

---

## 9. Cloudflare Configuration

| Feature | Configuration |
|---|---|
| **DNS** | CNAME to Vercel, proxied through Cloudflare |
| **SSL** | Full (strict) mode |
| **WAF** | OWASP rules enabled, custom rules for API protection |
| **Rate Limiting** | Auth endpoints: 10 req/min, API: 100 req/min |
| **Bot Management** | Block known bots on exam-taking routes |
| **Page Rules** | Cache static assets, bypass cache for API/auth |
| **Security Headers** | HSTS, CSP, X-Frame-Options |

---

## 10. Security Considerations

| Area | Implementation |
|---|---|
| **Data encryption** | At rest (Supabase/Postgres), in transit (TLS 1.3) |
| **Input validation** | Zod schemas on all API routes + client forms |
| **CSRF protection** | Next.js built-in + SameSite cookies |
| **XSS prevention** | React auto-escaping + CSP headers |
| **SQL injection** | Supabase parameterized queries + RLS |
| **Rate limiting** | Cloudflare + Vercel edge middleware |
| **Secrets management** | Vercel env vars, never client-side exposed |

---

## 11. Development Phases

### Phase 1 — Foundation (Weeks 1-3)
- [ ] Project setup (Next.js + Supabase + Vercel + Cloudflare)
- [ ] Authentication system (email, OAuth, 2FA)
- [ ] User management & RBAC
- [ ] University settings
- [ ] Core UI: Dashboard shell, navigation, theme

### Phase 2 — Exam Management (Weeks 4-7)
- [ ] Question bank CRUD with rich editor
- [ ] Question import/export
- [ ] Exam composer with drag-and-drop
- [ ] Exam scheduling & candidate assignment
- [ ] Email notifications

### Phase 3 — Exam Engine (Weeks 8-11)
- [ ] Candidate exam portal (lobby, system check)
- [ ] Real-time exam interface (timer, navigation, auto-save)
- [ ] Anti-cheat web measures (tab detection, fullscreen)
- [ ] Auto-grading & result computation
- [ ] Result publishing workflow

### Phase 4 — Proctoring & Monitoring (Weeks 12-15)
- [ ] Live proctoring dashboard (WebRTC video)
- [ ] AI anomaly detection (face, gaze, objects)
- [ ] Screen recording capture
- [ ] Proctor intervention tools (warn, pause, terminate)
- [ ] Proctoring reports

### Phase 5 — Safe Browser (Weeks 16-20)
- [ ] Electron lockdown browser
- [ ] Kiosk mode & process whitelisting
- [ ] VM/Remote desktop detection
- [ ] Cross-platform builds (Windows, macOS, Linux)
- [ ] Auto-update system

### Phase 6 — Analytics, Audit & Polish (Weeks 21-22)
- [ ] Comprehensive audit logging
- [ ] Analytics dashboards (exam, question level)
- [ ] Report generation (PDF, Excel)
- [ ] Performance optimization
- [ ] Production hardening

---

## 12. Key Libraries & Dependencies

| Category | Libraries |
|---|---|
| **UI Components** | shadcn/ui, Radix UI primitives |
| **Styling** | Tailwind CSS v4 |
| **State** | Zustand (client), React Server Components (server) |
| **Forms** | React Hook Form + Zod validation |
| **Rich Editor** | TipTap (questions), KaTeX (math) |
| **Charts** | Recharts or Tremor |
| **Tables** | TanStack Table |
| **DnD** | dnd-kit |
| **Email** | React Email + Resend |
| **PDF** | @react-pdf/renderer |
| **WebRTC** | LiveKit or Daily.co SDK |
| **Electron** | Electron Forge |
| **Testing** | Vitest, Playwright, Testing Library |

---

## 13. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel
VERCEL_URL=

# Cloudflare
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=

# Auth
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
RESEND_API_KEY=

# Proctoring
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=
```

---

## 14. Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files/Folders | kebab-case | `exam-composer.tsx` |
| Components | PascalCase | `ExamComposer` |
| Hooks | camelCase with `use` prefix | `useExamSession` |
| Utils/Helpers | camelCase | `calculateScore` |
| DB Tables | snake_case (plural) | `exam_schedules` |
| DB Columns | snake_case | `created_at` |
| API Routes | kebab-case | `/api/exam-results` |
| Env Vars | SCREAMING_SNAKE_CASE | `SUPABASE_SERVICE_ROLE_KEY` |
| Types/Interfaces | PascalCase | `ExamSchedule` |

---

> [!IMPORTANT]
> This plan is a living document. Update it as requirements evolve. Each phase should begin with a detailed sprint planning session.

> [!TIP]
> Start Phase 1 by running: `npx -y create-next-app@latest ./` in the workspace, then immediately set up the Supabase project and Cloudflare DNS.
