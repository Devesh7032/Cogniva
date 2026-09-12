import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2FjZmhtaWxxcnRqaml5emNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5Mjc2NzEsImV4cCI6MjEwNDUwMzY3MX0.Nq-sZqDP282NP3Pg4MHh1Nxvyv3HnYWMDjHiXpxlvAw';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') || DEFAULT_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  error?: unknown;
}> {
  try {
    const { error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      const isApiKeyError =
        authError.message.includes('Invalid API key') ||
        (authError as { status?: number }).status === 401;

      if (isApiKeyError) {
        return {
          success: false,
          message: 'Supabase API key is invalid or expired. Please check your Supabase project settings → API → anon key.',
          error: authError,
        };
      }

      return {
        success: false,
        message: `Supabase Auth error: ${authError.message}`,
        error: authError,
      };
    }

    return {
      success: true,
      message: 'Connected to Supabase project successfully!',
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to communicate with Supabase: ${err instanceof Error ? err.message : String(err)}`,
      error: err,
    };
  }
}

if (typeof window !== 'undefined') {
  testSupabaseConnection().then((res) => {
    if (res.success) {
      console.log('✅ [Supabase Status]:', res.message);
    } else {
      console.error('❌ [Supabase Status]:', res.message);
    }
  });
}
