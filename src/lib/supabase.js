// Server-only Supabase client.
// Uses service-role key; never import this file in client components.
import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabase;
