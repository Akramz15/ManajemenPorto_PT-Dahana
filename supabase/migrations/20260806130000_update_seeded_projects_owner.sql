DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- Try to find the Admin Dahana user or the first available user
    SELECT id INTO admin_id FROM public.user_profiles WHERE display_name ilike '%Admin Dahana%' LIMIT 1;
    
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM public.user_profiles LIMIT 1;
    END IF;

    IF admin_id IS NOT NULL THEN
        UPDATE public.projects 
        SET created_by = admin_id 
        WHERE id IN ('50000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000002');
    END IF;
END $$;
