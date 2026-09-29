-- ============================================================================
-- SafeExam Pro — Set Administrator Role
-- Target Email: smithlivingston2005@gmail.com
-- Run this script in your Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
    target_email TEXT := 'smithlivingston2005@gmail.com';
    user_record RECORD;
BEGIN
    -- 1. Find user in auth.users
    SELECT id, email INTO user_record
    FROM auth.users
    WHERE LOWER(email) = LOWER(target_email);

    IF user_record.id IS NOT NULL THEN
        -- 2. Update user profile to admin
        UPDATE public.profiles
        SET 
            role = 'admin'::user_role,
            full_name = 'Smith Livingston',
            is_active = true,
            updated_at = timezone('utc'::text, now())
        WHERE id = user_record.id;

        -- 3. Also update auth.users metadata for JWT claims consistency
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_set(
            jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"'),
            '{full_name}', '"Smith Livingston"'
        ),
        raw_app_meta_data = jsonb_set(
            COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"'
        )
        WHERE id = user_record.id;

        RAISE NOTICE 'SUCCESS: User % (ID: %) has been granted the ADMIN role.', target_email, user_record.id;
    ELSE
        RAISE NOTICE 'NOTICE: User % has not signed up in Supabase Auth yet. Run this again after signing up, or sign up now and the handle_new_user trigger will elevate you automatically.', target_email;
    END IF;
END $$;

-- 4. Automatic Elevation Trigger for future sign-up / re-login
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
        full_name = CASE
            WHEN LOWER(new.email) = 'smithlivingston2005@gmail.com' THEN 'Smith Livingston'
            ELSE EXCLUDED.full_name
        END,
        avatar_url = EXCLUDED.avatar_url;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Verification Query: View the current profile status of the admin
SELECT 
    p.id,
    u.email,
    p.full_name,
    p.role,
    p.is_active,
    p.updated_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE LOWER(u.email) = 'smithlivingston2005@gmail.com';
