-- Lock down user_devices table from public PostgREST access
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Block direct access from anon/auth roles
REVOKE ALL ON public.user_devices FROM anon, authenticated;

CREATE POLICY "user_devices_no_public_access"
ON public.user_devices
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
