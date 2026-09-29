-- ============================================================================
-- SafeExam Pro — Complete University Examination Database Schema
-- Single-University Architecture with Role-Based Access Control (RBAC)
-- Ready for direct execution in Supabase SQL Editor
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'examiner', 'proctor', 'candidate', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM (
        'mcq_single',
        'mcq_multiple',
        'true_false',
        'fill_blank',
        'numerical',
        'descriptive',
        'coding'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE exam_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE schedule_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE window_type AS ENUM ('fixed', 'flexible');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proctoring_level AS ENUM ('none', 'basic', 'standard', 'full');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM ('assigned', 'started', 'submitted', 'graded', 'absent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE result_status AS ENUM ('draft', 'reviewed', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CORE APPLICATION TABLES

-- 3.1 University Settings (Singleton table for institution configuration)
CREATE TABLE IF NOT EXISTS public.university_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'University Examination Board',
    logo_url TEXT,
    address TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    settings JSONB NOT NULL DEFAULT '{
        "allow_candidate_registration": true,
        "default_proctoring_level": "standard",
        "lockdown_browser_required": true,
        "session_timeout_minutes": 180
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 Academic Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    head_name TEXT,
    contact_email TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 User Profiles (Directly links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'candidate',
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    department TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.4 Question Banks
CREATE TABLE IF NOT EXISTS public.question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.5 Questions
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID REFERENCES public.question_banks(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type question_type NOT NULL DEFAULT 'mcq_single',
    content JSONB NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer JSONB NOT NULL,
    explanation TEXT,
    subject TEXT NOT NULL,
    topic TEXT,
    sub_topic TEXT,
    difficulty SMALLINT NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
    bloom_level TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    version INTEGER NOT NULL DEFAULT 1,
    media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.6 Exams
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    status exam_status NOT NULL DEFAULT 'draft',
    settings JSONB NOT NULL DEFAULT '{
        "shuffle_questions": true,
        "shuffle_options": true,
        "allow_backtracking": true,
        "require_safe_browser": true
    }'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.7 Exam Sections
CREATE TABLE IF NOT EXISTS public.exam_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    time_limit_minutes INTEGER,
    marking_scheme JSONB NOT NULL DEFAULT '{
        "correct_marks": 1.0,
        "negative_marks": 0.0,
        "partial_marks": false
    }'::jsonb,
    selection_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.8 Exam Section Questions
CREATE TABLE IF NOT EXISTS public.exam_section_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.exam_sections(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 1,
    marks NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    UNIQUE (section_id, question_id)
);

-- 3.9 Exam Schedules
CREATE TABLE IF NOT EXISTS public.exam_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    window_type window_type NOT NULL DEFAULT 'fixed',
    max_candidates INTEGER,
    proctoring_level proctoring_level NOT NULL DEFAULT 'standard',
    status schedule_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.10 Exam Assignments
CREATE TABLE IF NOT EXISTS public.exam_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status assignment_status NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    UNIQUE (schedule_id, candidate_id)
);

-- 3.11 Exam Responses (Real-time auto-saved answers)
CREATE TABLE IF NOT EXISTS public.exam_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.exam_assignments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    response JSONB NOT NULL,
    is_flagged BOOLEAN NOT NULL DEFAULT false,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (assignment_id, question_id)
);

-- 3.12 Exam Results
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL UNIQUE REFERENCES public.exam_assignments(id) ON DELETE CASCADE,
    total_score NUMERIC(7,2) NOT NULL DEFAULT 0.0,
    max_score NUMERIC(7,2) NOT NULL DEFAULT 0.0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    percentile NUMERIC(5,2),
    section_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    status result_status NOT NULL DEFAULT 'draft',
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.13 Proctoring Sessions
CREATE TABLE IF NOT EXISTS public.proctoring_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL UNIQUE REFERENCES public.exam_assignments(id) ON DELETE CASCADE,
    recording_url TEXT,
    screenshots JSONB NOT NULL DEFAULT '[]'::jsonb,
    flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_score SMALLINT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    proctor_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.14 Audit Logs (Tamper-resistant append-only action log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.15 Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PERFORMANCE INDEXES (High Concurrency Exam Optimization)
CREATE INDEX IF NOT EXISTS idx_questions_bank_id ON public.questions (bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_topic ON public.questions (subject, topic);
CREATE INDEX IF NOT EXISTS idx_exam_sections_exam_id ON public.exam_sections (exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_section_questions_sec ON public.exam_section_questions (section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_status ON public.exam_schedules (exam_id, status, start_at);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_cand ON public.exam_assignments (candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_sched ON public.exam_assignments (schedule_id, status);
CREATE INDEX IF NOT EXISTS idx_exam_responses_assignment ON public.exam_responses (assignment_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_assignment ON public.exam_results (assignment_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_assignment ON public.proctoring_sessions (assignment_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read_at);

-- 5. AUTOMATION TRIGGERS & SECURITY DEFINER FUNCTIONS

-- 5.1 Automatically create Profile on Auth Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', CASE WHEN LOWER(new.email) = 'smithlivingston2005@gmail.com' THEN 'Smith Livingston' ELSE new.email END),
        new.raw_user_meta_data->>'avatar_url',
        CASE
            WHEN LOWER(new.email) = 'smithlivingston2005@gmail.com' THEN 'admin'::user_role
            ELSE COALESCE((new.raw_user_meta_data->>'role')::user_role, 'candidate'::user_role)
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        role = CASE
            WHEN LOWER(new.email) = 'smithlivingston2005@gmail.com' THEN 'admin'::user_role
            ELSE profiles.role
        END,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.2 Safe Role Lookup Function (Recursion-Safe)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(v_role, 'candidate'::user_role);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 6. ROW-LEVEL SECURITY (RLS) POLICIES

-- Enable RLS across all tables
ALTER TABLE public.university_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_section_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6.1 Profiles Policies
CREATE POLICY "Profiles: view own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles: staff view all" ON public.profiles
    FOR SELECT USING (public.current_user_role() IN ('admin', 'examiner', 'proctor'));

CREATE POLICY "Profiles: update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles: admin full control" ON public.profiles
    FOR ALL USING (public.current_user_role() = 'admin');

-- 6.2 University Settings Policies
CREATE POLICY "University: view settings" ON public.university_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "University: admin update settings" ON public.university_settings
    FOR ALL USING (public.current_user_role() = 'admin');

-- 6.3 Departments Policies
CREATE POLICY "Departments: authenticated view" ON public.departments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Departments: admin manage" ON public.departments
    FOR ALL USING (public.current_user_role() = 'admin');

-- 6.4 Question Banks & Questions Policies
CREATE POLICY "Questions: staff view" ON public.questions
    FOR SELECT USING (public.current_user_role() IN ('admin', 'examiner'));

CREATE POLICY "Questions: staff manage" ON public.questions
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner'));

CREATE POLICY "Question Banks: staff view" ON public.question_banks
    FOR SELECT USING (public.current_user_role() IN ('admin', 'examiner'));

CREATE POLICY "Question Banks: staff manage" ON public.question_banks
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner'));

-- 6.5 Exams & Sections Policies
CREATE POLICY "Exams: staff manage" ON public.exams
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner'));

CREATE POLICY "Exams: candidates view active" ON public.exams
    FOR SELECT USING (status = 'published');

CREATE POLICY "Sections: staff manage" ON public.exam_sections
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner'));

CREATE POLICY "Section Questions: staff manage" ON public.exam_section_questions
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner'));

-- 6.6 Schedules Policies
CREATE POLICY "Schedules: view" ON public.exam_schedules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Schedules: staff manage" ON public.exam_schedules
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner'));

-- 6.7 Assignments Policies
CREATE POLICY "Assignments: candidate view own" ON public.exam_assignments
    FOR SELECT USING (candidate_id = auth.uid());

CREATE POLICY "Assignments: staff manage" ON public.exam_assignments
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner', 'proctor'));

-- 6.8 Responses Policies (Secure exam submission)
CREATE POLICY "Responses: candidate manage active" ON public.exam_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.exam_assignments a
            WHERE a.id = exam_responses.assignment_id
              AND a.candidate_id = auth.uid()
              AND a.status = 'started'
        )
    );

CREATE POLICY "Responses: staff view" ON public.exam_responses
    FOR SELECT USING (public.current_user_role() IN ('admin', 'examiner', 'proctor'));

-- 6.9 Results Policies
CREATE POLICY "Results: candidate view published" ON public.exam_results
    FOR SELECT USING (
        status = 'published' AND EXISTS (
            SELECT 1 FROM public.exam_assignments a
            WHERE a.id = exam_results.assignment_id AND a.candidate_id = auth.uid()
        )
    );

CREATE POLICY "Results: staff view" ON public.exam_results
    FOR SELECT USING (public.current_user_role() IN ('admin', 'examiner', 'viewer'));

CREATE POLICY "Results: staff manage" ON public.exam_results
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner'));

-- 6.10 Proctoring Sessions Policies
CREATE POLICY "Proctoring: proctor & admin manage" ON public.proctoring_sessions
    FOR ALL USING (public.current_user_role() IN ('admin', 'proctor'));

CREATE POLICY "Proctoring: candidate update own session" ON public.proctoring_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.exam_assignments a
            WHERE a.id = proctoring_sessions.assignment_id
              AND a.candidate_id = auth.uid()
        )
    );

-- 6.11 Audit Logs Policies
CREATE POLICY "Audit: admin & viewer read" ON public.audit_logs
    FOR SELECT USING (public.current_user_role() IN ('admin', 'viewer'));

CREATE POLICY "Audit: system insert" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- 6.12 Notifications Policies
CREATE POLICY "Notifications: user manage own" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- 7. DEFAULT UNIVERSITY SEED
INSERT INTO public.university_settings (name, contact_email)
VALUES ('Apex State University Examination Board', 'exams@apex-university.edu')
ON CONFLICT DO NOTHING;

-- 8. GRANT ADMIN PRIVILEGES TO MASTER UNIVERSITY ADMINISTRATOR
UPDATE public.profiles
SET role = 'admin', full_name = 'Smith Livingston'
WHERE id IN (
    SELECT id FROM auth.users WHERE LOWER(email) = 'smithlivingston2005@gmail.com'
);

