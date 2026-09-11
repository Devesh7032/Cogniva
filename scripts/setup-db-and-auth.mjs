import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!serviceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  process.exit(1);
}

console.log('=====================================================');
console.log(' COGNIVA COMPLETE BACKEND & AUTH PROVISIONING');
console.log('=====================================================');

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export function normalizeDobToPassword(dobStr) {
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
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${dd}${mm}${yyyy}`;
  }

  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${dd}${mm}${yyyy}`;
  }

  const digitsOnly = clean.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 6) {
    return digitsOnly;
  }

  return clean || '01012000';
}

async function setupDatabaseAndAuth() {
  console.log('\n--- Provisioning Admin Accounts ---');
  const admins = [
    { email: 'cdc@gmail.com', pass: 'cdc123', name: 'Academic Admin (CDC)' },
    { email: 'hod@gmail.com', pass: 'hod123', name: 'Department Head (HOD)' }
  ];

  const { data: { users: existingUsers } } = await adminClient.auth.admin.listUsers();
  const existingMap = new Map((existingUsers || []).map(u => [u.email.toLowerCase(), u]));

  for (const adm of admins) {
    let authUser = existingMap.get(adm.email.toLowerCase());
    if (!authUser) {
      console.log(`Creating Admin Auth User: ${adm.email}...`);
      const { data: created, error } = await adminClient.auth.admin.createUser({
        email: adm.email,
        password: adm.pass,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: adm.name }
      });
      if (error) {
        console.error(`Failed to create admin ${adm.email}:`, error.message);
      } else {
        authUser = created.user;
        console.log(`[ADMIN CREATED] ${adm.email} (${authUser.id})`);
      }
    } else {
      console.log(`Updating password for existing Admin: ${adm.email}...`);
      await adminClient.auth.admin.updateUserById(authUser.id, {
        password: adm.pass,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: adm.name }
      });
      console.log(`[ADMIN UPDATED] ${adm.email}`);
    }

    if (authUser) {
      await adminClient.from('profiles').upsert([
        { id: authUser.id, user_id: authUser.id, email: adm.email, full_name: adm.name, role: 'admin' }
      ], { onConflict: 'email' });
    }
  }

  console.log('\n--- Provisioning Student Accounts ---');
  const studentNames = [
    'Aditya Varma', 'Bhavna Sharma', 'Chetan Kumar', 'Deepa Nair', 'Eshwar Rao',
    'Farhan Khan', 'Gautam Patel', 'Harini Krishnan', 'Ishaan Gupta', 'Jaya Lakshmi',
    'Karthik Raja', 'Lekha Sunder', 'Manish Joshi', 'Nidhi Agarwal', 'Omkar Deshmukh',
    'Pooja Hegde', 'Rahul Banerjee', 'Sneha Kulkarni', 'Tarun Reddy', 'Uma Maheshwari'
  ];

  const studentsToInsert = [];

  for (let i = 0; i < 20; i++) {
    const num = String(i + 1).padStart(3, '0');
    const email = `student${num}@cogniva.edu`;
    const dob = '2004-05-10';
    const normPass = normalizeDobToPassword(dob);
    const name = studentNames[i];
    const regno = `2024CSE${num}`;

    console.log(`Processing Student ${num}: ${name} (${email})`);

    let authUser = existingMap.get(email.toLowerCase());
    if (!authUser) {
      const { data: created, error } = await adminClient.auth.admin.createUser({
        email,
        password: normPass,
        email_confirm: true,
        user_metadata: { role: 'student', full_name: name, regno, section: 'CSE-C' }
      });
      if (error) {
        console.error(`Error creating auth user for ${email}:`, error.message);
      } else {
        authUser = created.user;
        console.log(`[STUDENT AUTH CREATED] ${email} (ID: ${authUser.id})`);
      }
    } else {
      await adminClient.auth.admin.updateUserById(authUser.id, {
        password: normPass,
        email_confirm: true,
        user_metadata: { role: 'student', full_name: name, regno, section: 'CSE-C' }
      });
      console.log(`[STUDENT AUTH UPDATED] ${email}`);
    }

    if (authUser) {
      await adminClient.from('profiles').upsert([
        { id: authUser.id, user_id: authUser.id, email, full_name: name, role: 'student' }
      ], { onConflict: 'email' });

      studentsToInsert.push({
        id: `stud_csec_${num}`,
        auth_user_id: authUser.id,
        regno,
        name,
        email,
        department: 'CSE',
        year: 'Second Year',
        semester: '4',
        section: 'CSE-C',
        dob
      });
    }
  }

  try {
    const { error: insertErr } = await adminClient.from('students').upsert(studentsToInsert, { onConflict: 'email' });
    if (insertErr) {
      console.log('Students table upsert note:', insertErr.message);
    } else {
      console.log(`[STUDENTS TABLE] Successfully upserted ${studentsToInsert.length} student records into Supabase.`);
    }
  } catch (e) {
    console.error('Students insert exception:', e.message);
  }

  console.log('\n=====================================================');
  console.log(' PROVISIONING COMPLETE — ALL ACCOUNTS READY FOR LOGIN');
  console.log('=====================================================');
}

setupDatabaseAndAuth().catch(console.error);
