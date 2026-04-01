-- Enable RLS on public tables flagged by Supabase security advisor

-- 1) faculty_hierarchy: public read-only
ALTER TABLE public.faculty_hierarchy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faculty_hierarchy_public_read" ON public.faculty_hierarchy;
CREATE POLICY "faculty_hierarchy_public_read"
ON public.faculty_hierarchy
FOR SELECT
TO anon, authenticated
USING (true);

-- 2) modules: public read-only
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_public_read" ON public.modules;
CREATE POLICY "modules_public_read"
ON public.modules
FOR SELECT
TO anon, authenticated
USING (true);

-- 3) videos: public reads only for visible + approved rows
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "videos_public_read_approved_visible" ON public.videos;
CREATE POLICY "videos_public_read_approved_visible"
ON public.videos
FOR SELECT
TO anon, authenticated
USING (
  is_approved = true
  AND is_hidden = false
);
