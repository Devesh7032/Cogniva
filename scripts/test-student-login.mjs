import { createClient } from '@supabase/supabase-js';

const url = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2FjZmhtaWxxcnRqaml5emNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5Mjc2NzEsImV4cCI6MjEwNDUwMzY3MX0.Nq-sZqDP282NP3Pg4MHh1Nxvyv3HnYWMDjHiXpxlvAw';

const supabase = createClient(url, anonKey);

function normalizeDobToPassword(dobStr) {
  if (!dobStr) return '01012000';
  const clean = String(dobStr).trim();
  if (!isNaN(Number(clean)) && Number(clean) > 20000 && Number(clean) < 60000) {
    const excelDate = new Date((Number(clean) - (25567 + 2)) * 86400 * 1000);
    const dd = String(excelDate.getUTCDate()).padStart(2, '0');
    const mm = String(excelDate.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = String(excelDate.getUTCFullYear());
    return `${dd}${mm}${yyyy}`;
  }
  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[3].padStart(2, '0')}${ymdMatch[2].padStart(2, '0')}${ymdMatch[1]}`;
  }
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[1].padStart(2, '0')}${dmyMatch[2].padStart(2, '0')}${dmyMatch[3]}`;
  }
  return clean.replace(/[^0-9]/g, '');
}

async function testAllLogins() {
  console.log('=====================================================');
  console.log(' COGNIVA COMPLETE AUTHENTICATION CREDENTIAL VERIFICATION');
  console.log('=====================================================');

  console.log('\n--- VERIFYING ADMIN ACCOUNTS ---');
  const admins = [
    { email: 'cdc@gmail.com', pass: 'cdc123', name: 'Academic Admin (CDC)' },
    { email: 'hod@gmail.com', pass: 'hod123', name: 'Department Head (HOD)' }
  ];

  for (const adm of admins) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: adm.email, password: adm.pass });
    if (!error) {
      console.log(`✅ [ADMIN VERIFIED] Email: ${adm.email} | Pass: ${adm.pass} | Name: ${adm.name}`);
    } else {
      console.error(`❌ [ADMIN FAILED] Email: ${adm.email} | Reason: ${error.message}`);
    }
  }

  console.log('\n--- VERIFYING FACULTY ACCOUNTS ---');
  const defaultFaculty = [
    { name: 'Dr. Anjali Menon', email: 'anjali.menon@example.edu', dob: '14-03-1985' },
    { name: 'Dr. Ravi Chandran', email: 'ravi.chandran@example.edu', dob: '22-07-1982' },
    { name: 'Prof. Meera Krishnan', email: 'meera.krishnan@example.edu', dob: '09-01-1988' },
    { name: 'Dr. Suresh Balan', email: 'suresh.balan@example.edu', dob: '05-11-1980' },
    { name: 'Prof. Neha Kapoor', email: 'neha.kapoor@example.edu', dob: '18-06-1987' },
    { name: 'Dr. Arvind Nair', email: 'arvind.nair@example.edu', dob: '27-09-1984' },
    { name: 'Prof. Kavitha Iyer', email: 'kavitha.iyer@example.edu', dob: '11-02-1989' },
    { name: 'Dr. Prakash Verma', email: 'prakash.verma@example.edu', dob: '03-12-1981' },
    { name: 'Prof. Swathi Rao', email: 'swathi.rao@example.edu', dob: '25-04-1986' },
    { name: 'Dr. Vikram Das', email: 'vikram.das@example.edu', dob: '16-08-1983' }
  ];

  for (const f of defaultFaculty) {
    const pass = normalizeDobToPassword(f.dob);
    const { data, error } = await supabase.auth.signInWithPassword({ email: f.email, password: pass });
    if (!error) {
      console.log(`✅ [FACULTY VERIFIED] ${f.name} | Email: ${f.email} | DOB: ${f.dob} | Pass: ${pass}`);
    } else {
      console.error(`❌ [FACULTY FAILED] ${f.name} | Email: ${f.email} | Reason: ${error.message}`);
    }
  }

  console.log('\n--- VERIFYING STUDENT ACCOUNTS ---');
  const studentNames = [
    'Aditya Varma', 'Bhavna Sharma', 'Chetan Kumar', 'Deepa Nair', 'Eshwar Rao',
    'Farhan Khan', 'Gautam Patel', 'Harini Krishnan', 'Ishaan Gupta', 'Jaya Lakshmi',
    'Karthik Raja', 'Lekha Sunder', 'Manish Joshi', 'Nidhi Agarwal', 'Omkar Deshmukh',
    'Pooja Hegde', 'Rahul Banerjee', 'Sneha Kulkarni', 'Tarun Reddy', 'Uma Maheshwari'
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const num = String(i + 1).padStart(3, '0');
    const email = `student${num}@cogniva.edu`;
    const dob = '2004-05-10';
    const pass = normalizeDobToPassword(dob);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (!error) {
      console.log(`✅ [STUDENT VERIFIED] ${studentNames[i]} | Email: ${email} | DOB: ${dob} | Pass: ${pass}`);
    } else {
      console.error(`❌ [STUDENT FAILED] ${studentNames[i]} | Email: ${email} | Reason: ${error.message}`);
    }
  }
}

testAllLogins().catch(console.error);

