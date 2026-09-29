-- ============================================================================
-- SafeExam Pro — Common vs. Department-Specific Questions Migration
-- Relational linking of students, questions, question banks, and exam sections
-- ============================================================================

-- 1. Add department_id to public.profiles (Foreign Key)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
    END IF;
END $$;

-- 2. Backfill profiles.department_id from existing departments
UPDATE public.profiles p
SET department_id = d.id
FROM public.departments d
WHERE p.department_id IS NULL 
  AND (p.department = d.name OR p.department = d.code OR d.name ILIKE '%' || p.department || '%');

-- 3. Enhance questions table with department criteria
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE public.questions ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_questions_department_id ON public.questions(department_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'is_common'
    ) THEN
        ALTER TABLE public.questions ADD COLUMN is_common BOOLEAN NOT NULL DEFAULT true;
        CREATE INDEX IF NOT EXISTS idx_questions_is_common ON public.questions(is_common);
    END IF;
END $$;

-- 4. Enhance question_banks table with department affiliation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'question_banks' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE public.question_banks ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'question_banks' AND column_name = 'is_common'
    ) THEN
        ALTER TABLE public.question_banks ADD COLUMN is_common BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- 5. Enhance exam_sections table with section scope
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_sections' AND column_name = 'scope'
    ) THEN
        ALTER TABLE public.exam_sections ADD COLUMN scope TEXT NOT NULL DEFAULT 'common' 
            CHECK (scope IN ('common', 'department_specific'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_sections' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE public.exam_sections ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;
END $$;
