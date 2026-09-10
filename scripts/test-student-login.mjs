import { createClient } from '@supabase/supabase-js';

const url = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2FjZmhtaWxxcnRqaml5emNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5Mjc2NzEsImV4cCI6MjEwNDUwMzY3MX0.Nq-sZqDP282NP3Pg4MHh1Nxvyv3HnYWMDjHiXpxlvAw';

const supabase = createClient(url, anonKey);

async function testStudentLogin() {
  console.log('=====================================================');
  console.log(' COGNIVA END-TO-END STUDENT AUTHENTICATION TEST');
  console.log('=====================================================');

  // 1. Correct Credentials Test
  console.log('\n[TEST 1] Logging in student001@cogniva.edu with password "10052004"...');
  const { data: passData, error: passError } = await supabase.auth.signInWithPassword({
    email: 'student001@cogniva.edu',
    password: '10052004',
  });

  if (passError) {
    console.error('❌ TEST 1 FAILED:', passError.message);
  } else {
    console.log('✅ TEST 1 PASSED: Successfully authenticated!');
    console.log('   Authenticated User ID:', passData.user.id);
    console.log('   User Email:', passData.user.email);
    console.log('   Metadata Role:', passData.user.user_metadata?.role);
    console.log('   Metadata Name:', passData.user.user_metadata?.full_name);
  }

  // 2. Incorrect Credentials Test
  console.log('\n[TEST 2] Testing incorrect DOB / password "99999999"...');
  const { data: badData, error: badError } = await supabase.auth.signInWithPassword({
    email: 'student001@cogniva.edu',
    password: '99999999',
  });

  if (badError) {
    console.log('✅ TEST 2 PASSED: Incorrect password was properly rejected!');
    console.log('   Rejection Reason:', badError.message);
  } else {
    console.error('❌ TEST 2 FAILED: Incorrect password was accepted!');
  }
}

testStudentLogin().catch(console.error);
