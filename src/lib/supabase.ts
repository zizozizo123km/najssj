import { createClient } from '@supabase/supabase-js';

// Use provided credentials or environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://gmnvfimccnfenfciajqc.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Khzx9sxQMHJK_QXFNVLDHw_dfw2r3zB';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('Supabase credentials missing! Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
