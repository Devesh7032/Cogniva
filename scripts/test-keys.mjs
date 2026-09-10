import { createClient } from '@supabase/supabase-js';

const url = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2FjZmhtaWxxcnRqaml5emNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5Mjc2NzEsImV4cCI6MjEwNDUwMzY3MX0.Nq-sZqDP282NP3Pg4MHh1Nxvyv3HnYWMDjHiXpxlvAw';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2FjZmhtaWxxcnRqaml5emNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyNzY3MSwiZXhwIjoyMTA0NTAzNjcxfQ.CA8XmqBZ0R0Sc306c8uYR0NXX_Xja5YKoFs7sewMud0';

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
