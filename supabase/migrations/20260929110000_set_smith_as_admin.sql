-- Migration: 20260929110000_set_smith_as_admin.sql
-- Set smithlivingston2005@gmail.com as primary system administrator

DO $$
DECLARE
    target_email TEXT := 'smithlivingston2005@gmail.com';
    user_record RECORD;
BEGIN
    SELECT id, email INTO user_record
    FROM auth.users
    WHERE LOWER(email) = LOWER(target_email);

    IF user_record.id IS NOT NULL THEN
        UPDATE public.profiles
        SET 
            role = 'admin'::user_role,
            full_name = 'Smith Livingston',
            is_active = true,
            updated_at = timezone('utc'::text, now())
        WHERE id = user_record.id;

        UPDATE auth.users
        SET raw_user_meta_data = jsonb_set(
            jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"'),
            '{full_name}', '"Smith Livingston"'
        ),
        raw_app_meta_data = jsonb_set(
            COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"'
        )
        WHERE id = user_record.id;
    END IF;
END $$;
