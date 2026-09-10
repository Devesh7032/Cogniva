import { createClient } from '@supabase/supabase-js';

const url = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoiZ3RvYWNmaWxxcnRqaml5emNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5Mjc2NzEsImV4cCI6MjEwNDUwMzY3MX0.Nq-sZqDP282NP3Pg4MHh1Nxvyv3HnYWMDjHiXpxlvAw';

const supabase = createClient(url, key);

async function testStudentLogin() {
  console.log('--- Testing Student Login via Supabase Auth ---');
  
  // Test student001@cogniva.edu with password 10052004 (DOB: 2004-05-10 -> 10052004)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'student001@cogniva.edu',
    password: '10052004',
  });

  if (error) {
    console.error('FAILED to log in student001@cogniva.edu:', error.message);
  } else {
    console.log('SUCCESSFULLY LOGGED IN student001@cogniva.edu!');
    console.log('User ID:', data.user.id);
    console.log('User Metadata:', data.user.user_metadata);
  }
}

testStudentLogin();
