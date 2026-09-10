import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
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
