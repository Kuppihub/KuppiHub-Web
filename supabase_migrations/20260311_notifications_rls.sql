-- Lock down notifications table from public PostgREST access
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Block direct access from anon/auth roles
REVOKE ALL ON public.notifications FROM anon, authenticated;

CREATE POLICY "notifications_no_public_access"
ON public.notifications
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
