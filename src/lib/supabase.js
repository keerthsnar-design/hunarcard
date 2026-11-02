import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Check if valid user-supplied Supabase credentials exist
export const isConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseKey.includes('fake-anon-key') &&
  supabaseUrl.startsWith('http')
);

// Fallback placeholder so app evaluation does not throw when running in unconfigured demo mode
const clientUrl = isConfigured ? supabaseUrl : 'https://demo-unconfigured.supabase.co';
const clientKey = isConfigured ? supabaseKey : 'demo-placeholder-anon-key';

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
