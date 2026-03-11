-- Enable RLS on students and hide index numbers from public roles
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow public reads on students, but never expose index_no
CREATE POLICY "students_public_read"
ON public.students
FOR SELECT
USING (true);

GRANT SELECT ON public.students TO anon, authenticated;
REVOKE SELECT (index_no) ON public.students FROM anon, authenticated;

-- Optional: keep future role grants consistent
COMMENT ON COLUMN public.students.index_no IS 'Sensitive: never expose to anon/auth clients.';
