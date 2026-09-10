import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2FjZmhtaWxxcnRqaml5emNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyNzY3MSwiZXhwIjoyMTA0NTAzNjcxfQ.CA8XmqBZ0R0Sc306c8uYR0NXX_Xja5YKoFs7sewMud0';

console.log('=====================================================');
console.log(' COGNIVA SERVER-SIDE FACULTY & STUDENT AUTH SYNC');
console.log('=====================================================');

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export function normalizeDobToPassword(dobStr) {
  if (!dobStr) return '01012000';
  const clean = String(dobStr).trim();

  // Case 1: YYYY-MM-DD or YYYY/MM/DD (e.g. 2000-05-09 -> 09052000)
  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${dd}${mm}${yyyy}`;
  }

  // Case 2: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY (e.g. 09/05/2000 -> 09052000)
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${dd}${mm}${yyyy}`;
  }

  // Case 3: Digits only (e.g. 09052000)
  const digitsOnly = clean.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 6) {
    return digitsOnly;
  }

  return clean || '01012000';
}

async function syncAuthUsers() {
  // 1. Fetch all Auth users
  const { data: { users: authUsers }, error: authErr } = await adminClient.auth.admin.listUsers();
  if (authErr) {
    console.error('Failed to list Auth users:', authErr.message);
  }

  const existingAuthMap = new Map();
  if (authUsers) {
    for (const u of authUsers) {
      if (u.email) existingAuthMap.set(u.email.toLowerCase(), u);
    }
  }

  // 2. Process Faculty Records
  console.log('\n--- Syncing Faculty Accounts ---');
  const { data: dbFacultyRows, error: facErr } = await adminClient.from('faculty').select('*');
  if (facErr) {
    console.log('Faculty table query note:', facErr.message);
  }

  const defaultFaculty = [
    { name: 'Dr. Anjali Menon', email: 'anjali.menon@example.edu', dob: '14-03-1985', employee_id: 'FAC001', department: 'Computer Science and Engineering', year: '2', section: 'CSE-C' },
    { name: 'Dr. Ravi Chandran', email: 'ravi.chandran@example.edu', dob: '22-07-1982', employee_id: 'FAC002', department: 'Computer Science and Engineering', year: '2', section: 'CSE-A' },
    { name: 'Prof. Meera Krishnan', email: 'meera.krishnan@example.edu', dob: '09-01-1988', employee_id: 'FAC003', department: 'Computer Science and Engineering', year: '2', section: 'CSE-B' },
    { name: 'Dr. Suresh Balan', email: 'suresh.balan@example.edu', dob: '05-11-1980', employee_id: 'FAC004', department: 'Computer Science and Engineering', year: '2', section: 'CSE-D' },
    { name: 'Prof. Neha Kapoor', email: 'neha.kapoor@example.edu', dob: '18-06-1987', employee_id: 'FAC005', department: 'Computer Science and Engineering', year: '2', section: 'CSE-E' },
    { name: 'Dr. Arvind Nair', email: 'arvind.nair@example.edu', dob: '27-09-1984', employee_id: 'FAC006', department: 'Computer Science and Engineering', year: '2', section: 'CSE-F' },
    { name: 'Prof. Kavitha Iyer', email: 'kavitha.iyer@example.edu', dob: '11-02-1989', employee_id: 'FAC007', department: 'Computer Science and Engineering', year: '2', section: 'CSE-G' },
    { name: 'Dr. Prakash Verma', email: 'prakash.verma@example.edu', dob: '03-12-1981', employee_id: 'FAC008', department: 'Computer Science and Engineering', year: '2', section: 'CSE-H' },
    { name: 'Prof. Swathi Rao', email: 'swathi.rao@example.edu', dob: '25-04-1986', employee_id: 'FAC009', department: 'Computer Science and Engineering', year: '2', section: 'CSE-I' },
    { name: 'Dr. Vikram Das', email: 'vikram.das@example.edu', dob: '16-08-1983', employee_id: 'FAC010', department: 'Computer Science and Engineering', year: '2', section: 'CSE-J' }
  ];

  const facultyMap = new Map();
  defaultFaculty.forEach(f => facultyMap.set(f.email.toLowerCase(), f));
  if (dbFacultyRows && dbFacultyRows.length > 0) {
    dbFacultyRows.forEach(f => {
      if (f.email) facultyMap.set(f.email.toLowerCase(), f);
    });
  }

  const facultyRows = Array.from(facultyMap.values());

  if (facultyRows && facultyRows.length > 0) {
    for (const fac of facultyRows) {
      const email = String(fac.email || '').trim().toLowerCase();
      if (!email) continue;

      const normPass = normalizeDobToPassword(fac.dob);
      console.log(`Processing Faculty: ${fac.name} (${email}) | Pass: ${normPass}`);

      let authUser = existingAuthMap.get(email);
      if (!authUser) {
        console.log(`Creating Auth User for faculty: ${email}...`);
        const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
          email,
          password: normPass,
          email_confirm: true,
          user_metadata: { role: 'faculty', full_name: fac.name }
        });

        if (createErr) {
          console.error(`Error creating Auth user for ${email}:`, createErr.message);
          continue;
        }
        authUser = createData.user;
        existingAuthMap.set(email, authUser);
        console.log(`[CREATED] Auth User ID: ${authUser.id}`);
      } else {
        console.log(`Updating Auth password for existing user: ${email}...`);
        await adminClient.auth.admin.updateUserById(authUser.id, {
          password: normPass,
          email_confirm: true
        });
        console.log(`[UPDATED] Password confirmed for ${email}`);
      }

      // Upsert profile in public.profiles
      if (authUser) {
        try {
          await adminClient.from('profiles').upsert([
            {
              id: authUser.id,
              user_id: authUser.id,
              email,
              full_name: fac.name,
              role: 'faculty'
            }
          ], { onConflict: 'email' });
          console.log(`[PROFILES] Profile linked for ${email}`);
        } catch (e) {
          console.log(`[PROFILES NOTE] Profile sync skipped: ${e.message}`);
        }
      }
    }
  } else {
    console.log('No faculty rows found.');
  }

  // 3. Process Student Records
  console.log('\n--- Syncing Student Accounts ---');
  const { data: studentRows, error: studErr } = await adminClient.from('students').select('*');
  if (studErr) {
    console.log('Students table query note:', studErr.message);
  }

  if (studentRows && studentRows.length > 0) {
    for (const st of studentRows) {
      const email = String(st.email || '').trim().toLowerCase();
      if (!email) continue;

      const normPass = normalizeDobToPassword(st.dob);
      console.log(`Processing Student: ${st.name} (${email}) | Pass: ${normPass}`);

      let authUser = existingAuthMap.get(email);
      if (!authUser) {
        console.log(`Creating Auth User for student: ${email}...`);
        const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
          email,
          password: normPass,
          email_confirm: true,
          user_metadata: { role: 'student', full_name: st.name }
        });

        if (createErr) {
          console.error(`Error creating Auth user for ${email}:`, createErr.message);
          continue;
        }
        authUser = createData.user;
        existingAuthMap.set(email, authUser);
        console.log(`[CREATED] Auth User ID: ${authUser.id}`);
      } else {
        await adminClient.auth.admin.updateUserById(authUser.id, {
          password: normPass,
          email_confirm: true
        });
        console.log(`[UPDATED] Password confirmed for ${email}`);
      }

      if (authUser) {
        await adminClient.from('profiles').upsert([
          {
            id: authUser.id,
            user_id: authUser.id,
            email,
            full_name: st.name,
            role: 'student'
          }
        ], { onConflict: 'email' });
        console.log(`[PROFILES] Profile linked for ${email}`);
      }
    }
  } else {
    console.log('No student rows in database.');
  }

  console.log('\n=====================================================');
  console.log(' FACULTY & STUDENT AUTH SYNC COMPLETE');
  console.log('=====================================================');
}

syncAuthUsers().catch(err => {
  console.error('Fatal sync error:', err);
});
