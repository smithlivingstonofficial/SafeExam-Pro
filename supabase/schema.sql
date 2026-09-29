-- ============================================================================
-- SafeExam Pro — University Entrance Exam Platform Database Schema
-- Single-University Architecture with Role-Based Access Control (RBAC)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
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

-- 3. CORE TABLES

-- 3.1 University Settings (Single record instance)
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

-- 3.2 Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    head_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 User Profiles (Extends Supabase auth.users)
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

-- 3.11 Exam Responses
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

-- 3.14 Audit Logs (Immutable)
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

-- 4. PROFILE AUTOMATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        new.raw_user_meta_data->>'avatar_url',
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'candidate'::user_role)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ROW-LEVEL SECURITY (RLS) POLICIES

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

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Users can view their own profile, Admins can view all
CREATE POLICY "Users view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.current_user_role() IN ('admin', 'examiner', 'proctor'));

CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins full profiles control" ON public.profiles
    FOR ALL USING (public.current_user_role() = 'admin');

-- University Settings: Anyone logged in can read, Admins can update
CREATE POLICY "Read university settings" ON public.university_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin update university settings" ON public.university_settings
    FOR ALL USING (public.current_user_role() = 'admin');

-- Questions: Examiners and Admins can create/edit; Candidates cannot access questions table directly
CREATE POLICY "Staff view questions" ON public.questions
    FOR SELECT USING (public.current_user_role() IN ('admin', 'examiner'));

CREATE POLICY "Staff insert questions" ON public.questions
    FOR INSERT WITH CHECK (public.current_user_role() IN ('admin', 'examiner'));

CREATE POLICY "Staff update questions" ON public.questions
    FOR UPDATE USING (public.current_user_role() IN ('admin', 'examiner'));

-- Exams: Viewable by Staff; Published viewable during schedules
CREATE POLICY "Staff manage exams" ON public.exams
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner'));

CREATE POLICY "Candidates view active exams" ON public.exams
    FOR SELECT USING (status = 'published');

-- Schedules: All authenticated users can view schedules
CREATE POLICY "View schedules" ON public.exam_schedules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff manage schedules" ON public.exam_schedules
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner'));

-- Assignments: Candidates can view their own; Staff can view all
CREATE POLICY "Candidate view own assignments" ON public.exam_assignments
    FOR SELECT USING (candidate_id = auth.uid() OR public.current_user_role() IN ('admin', 'examiner', 'proctor'));

CREATE POLICY "Staff manage assignments" ON public.exam_assignments
    FOR ALL USING (public.current_user_role() IN ('admin', 'examiner'));

-- Responses: Candidates can save their own responses during active exam
CREATE POLICY "Candidates manage own responses" ON public.exam_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.exam_assignments a
            WHERE a.id = exam_responses.assignment_id
              AND a.candidate_id = auth.uid()
              AND a.status = 'started'
        )
        OR public.current_user_role() IN ('admin', 'examiner', 'proctor')
    );

-- Results: Candidates can view only published results for their own assignment
CREATE POLICY "Candidates view published results" ON public.exam_results
    FOR SELECT USING (
        (status = 'published' AND EXISTS (
            SELECT 1 FROM public.exam_assignments a
            WHERE a.id = exam_results.assignment_id AND a.candidate_id = auth.uid()
        ))
        OR public.current_user_role() IN ('admin', 'examiner', 'viewer')
    );

-- Audit logs: Read-only for admin and viewer roles; Insert allowed via trigger/server
CREATE POLICY "Admin view audit logs" ON public.audit_logs
    FOR SELECT USING (public.current_user_role() IN ('admin', 'viewer'));

CREATE POLICY "System insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Notifications: Users only see their own notifications
CREATE POLICY "User notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- 6. DEFAULT UNIVERSITY RECORD
INSERT INTO public.university_settings (name, contact_email)
VALUES ('Apex State University Examination Board', 'exams@apex-university.edu')
ON CONFLICT DO NOTHING;
