-- Resource library for module content (past papers, notes, slides, etc.)

CREATE TABLE IF NOT EXISTS public.resource_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.resource_categories (name, slug, sort_order)
VALUES
  ('Past Papers', 'past-papers', 1),
  ('Past Paper Answers', 'past-paper-answers', 2),
  ('Short Notes', 'short-notes', 3),
  ('Lecture Slides', 'lecture-slides', 4),
  ('Kuppi Resources', 'kuppi-resources', 5)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.resource_folders (
  id BIGSERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES public.resource_categories(id),
  parent_id BIGINT NULL REFERENCES public.resource_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_folders_module_category_parent
  ON public.resource_folders (module_id, category_id, parent_id, sort_order, id);

CREATE TABLE IF NOT EXISTS public.resources (
  id BIGSERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES public.resource_categories(id),
  folder_id BIGINT NULL REFERENCES public.resource_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NULL,
  file_size_bytes BIGINT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'discord',
  storage_key TEXT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  allowed_domains TEXT[] NULL,
  uploaded_by_user_id INTEGER NULL REFERENCES public.users(id),
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_module_category_folder
  ON public.resources (module_id, category_id, folder_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resources_allowed_domains
  ON public.resources USING GIN (allowed_domains);

ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resource_categories_public_read ON public.resource_categories;
CREATE POLICY resource_categories_public_read
ON public.resource_categories
FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

DROP POLICY IF EXISTS resource_folders_public_read ON public.resource_folders;
CREATE POLICY resource_folders_public_read
ON public.resource_folders
FOR SELECT
TO anon, authenticated
USING (TRUE);

DROP POLICY IF EXISTS resources_public_read ON public.resources;
CREATE POLICY resources_public_read
ON public.resources
FOR SELECT
TO anon, authenticated
USING (is_active = TRUE AND is_approved = TRUE);
