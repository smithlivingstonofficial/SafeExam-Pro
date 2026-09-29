    -- ============================================================================
    -- SafeExam Pro — Enhance Departments Schema
    -- Adds academic code, contact email, and description to departments
    -- ============================================================================

    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'departments' 
            AND column_name = 'code'
        ) THEN
            ALTER TABLE public.departments ADD COLUMN code TEXT UNIQUE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'departments' 
            AND column_name = 'description'
        ) THEN
            ALTER TABLE public.departments ADD COLUMN description TEXT;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'departments' 
            AND column_name = 'contact_email'
        ) THEN
            ALTER TABLE public.departments ADD COLUMN contact_email TEXT;
        END IF;
    END $$;
