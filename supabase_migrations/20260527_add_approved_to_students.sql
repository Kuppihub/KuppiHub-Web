-- Add approved column to students table
-- Used to moderate which tutors appear on the Tutors Directory Page and in Add Kuppi suggestions list.

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT TRUE;

-- Add a comment on the column for clear database documentation
COMMENT ON COLUMN public.students.approved IS 'Indicates if the student is approved to be shown on the tutors page and suggestible in form autocomplete overlays.';

-- Ensure any existing records have it explicitly set to true
UPDATE public.students 
SET approved = TRUE 
WHERE approved IS NULL;
