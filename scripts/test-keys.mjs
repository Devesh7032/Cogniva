import { createClient } from '@supabase/supabase-js';

const url = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const anonKey = 'your_supabase_service_role_key';
const serviceKey = 'your_supabase_service_role_key';

async function testKeys() {
  console.log('--- Testing Anon Key ---');
  const anonClient = createClient(url, anonKey);
  const { data: d1, error: e1 } = await anonClient.auth.signInWithPassword({
    email: 'student001@cogniva.edu',
    password: '10052004'
  });
  console.log('Anon Key Result:', { user: d1?.user?.email, error: e1?.message });

  console.log('\n--- Testing Service Role Key ---');
  const serviceClient = createClient(url, serviceKey);
  const { data: d2, error: e2 } = await serviceClient.auth.signInWithPassword({
    email: 'student001@cogniva.edu',
    password: '10052004'
  });
  console.log('Service Key Result:', { user: d2?.user?.email, error: e2?.message });
}

testKeys();
