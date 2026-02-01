
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rjbyymvkvadtqbslihnf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_McP2V9anDn3OMkmnCrrdCQ_p2EWZ0O-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
