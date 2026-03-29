-- Send approved video data to email service when a video first becomes approved.
-- Fast path: async HTTP via pg_net + indexed module_id matching in JSONB.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.system_config (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.system_config FROM anon, authenticated;

DROP POLICY IF EXISTS "system_config_no_public_access" ON public.system_config;
CREATE POLICY "system_config_no_public_access"
ON public.system_config
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

INSERT INTO public.system_config (name, value)
VALUES ('emaildata_webhook_url', 'https://emaildata.kuppihub.org')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.system_config (name, value)
VALUES ('emaildata_webhook_secret', '')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_user_dashboard_modules_module_ids_gin
ON public.user_dashboard_modules
USING GIN (module_ids jsonb_path_ops);

CREATE OR REPLACE FUNCTION public.notify_emaildata_on_video_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_module_name TEXT;
  v_module_code TEXT;
  v_webhook_url TEXT;
  v_webhook_secret TEXT;
  v_emails_list JSONB;
  v_recipient_emails TEXT[];
  v_payload JSONB;
BEGIN
  -- Run only when the row is approved for the first time.
  IF NEW.is_approved IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND COALESCE(OLD.is_approved, FALSE) = TRUE THEN
    RETURN NEW;
  END IF;

  SELECT m.name, m.code
  INTO v_module_name, v_module_code
  FROM public.modules m
  WHERE m.id = NEW.module_id;

  SELECT COALESCE(
    ARRAY_AGG(DISTINCT u.email)
      FILTER (WHERE u.email IS NOT NULL AND u.email <> ''),
    ARRAY[]::TEXT[]
  ),
  COALESCE(
    JSONB_AGG(
      DISTINCT JSONB_BUILD_OBJECT(
        'name', COALESCE(NULLIF(u.display_name, ''), split_part(u.email, '@', 1)),
        'email', u.email
      )
    ) FILTER (WHERE u.email IS NOT NULL AND u.email <> ''),
    '[]'::JSONB
  )
  INTO v_recipient_emails
     , v_emails_list
  FROM public.user_dashboard_modules udm
  JOIN public.users u ON u.id = udm.user_id
  WHERE udm.module_ids @> jsonb_build_array(NEW.module_id)
     OR udm.module_ids @> jsonb_build_array(NEW.module_id::TEXT);

  -- No recipients to notify.
  IF COALESCE(array_length(v_recipient_emails, 1), 0) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT sc.value
  INTO v_webhook_url
  FROM public.system_config sc
  WHERE sc.name = 'emaildata_webhook_url'
  LIMIT 1;

  -- Missing webhook config; skip without failing approval.
  IF v_webhook_url IS NULL OR btrim(v_webhook_url) = '' THEN
    RETURN NEW;
  END IF;

  SELECT sc.value
  INTO v_webhook_secret
  FROM public.system_config sc
  WHERE sc.name = 'emaildata_webhook_secret'
  LIMIT 1;

  -- Missing webhook secret; skip sending unauthenticated request.
  IF v_webhook_secret IS NULL OR btrim(v_webhook_secret) = '' THEN
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'module_name', COALESCE(v_module_name, ''),
    'module_code', COALESCE(v_module_code, ''),
    'title', COALESCE(NEW.title, ''),
    'description', COALESCE(NEW.description, ''),
    'is-kuppi', COALESCE(NEW.is_kuppi, FALSE),
    'language-code', COALESCE(NEW.language_code, ''),
    'emails_list', v_emails_list,
    'emails', to_jsonb(v_recipient_emails),
    'video_id', NEW.id
  );

  PERFORM net.http_post(
    url := v_webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_webhook_secret,
      'x-webhook-source', 'kuppihub-db-trigger'
    ),
    body := v_payload
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Keep approval writes non-blocking even if webhook fails.
    RAISE WARNING 'notify_emaildata_on_video_approval failed for video %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_emaildata_on_video_approval ON public.videos;

CREATE TRIGGER trg_notify_emaildata_on_video_approval
AFTER INSERT OR UPDATE OF is_approved ON public.videos
FOR EACH ROW
WHEN (NEW.is_approved = TRUE)
EXECUTE FUNCTION public.notify_emaildata_on_video_approval();
