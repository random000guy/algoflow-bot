-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_with_approval();

-- Create improved function that makes first user admin
CREATE OR REPLACE FUNCTION public.handle_new_user_with_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing profiles to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Insert into profiles - first user is automatically admin
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    user_count = 0  -- First user becomes admin
  );
  
  -- If first user, approve automatically, otherwise require approval
  IF user_count = 0 THEN
    -- First user is auto-approved
    INSERT INTO public.pending_users (user_id, email, full_name, status, approved_at, approved_by)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      'approved',
      now(),
      new.id
    );
  ELSE
    -- Other users need approval
    INSERT INTO public.pending_users (user_id, email, full_name, status)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      'pending'
    );
  END IF;
  
  RETURN new;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_with_approval();