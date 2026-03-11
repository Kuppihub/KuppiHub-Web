-- Harden public tables and views

-- Users table: no public access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.users FROM anon, authenticated;

CREATE POLICY "users_no_public_access"
ON public.users
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- User dashboard modules: private per user, no public access
ALTER TABLE public.user_dashboard_modules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_dashboard_modules FROM anon, authenticated;

CREATE POLICY "user_dashboard_modules_no_public_access"
ON public.user_dashboard_modules
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Ensure view runs with invoker privileges
ALTER VIEW public.student_video_counts SET (security_invoker = true);
