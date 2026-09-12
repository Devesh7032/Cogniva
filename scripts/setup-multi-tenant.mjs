import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../artifacts/cogniva-platform/.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        envVars[key] = val;
      }
    }
  });
}

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2FjZmhtaWxxcnRqaml5emNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyNzY3MSwiZXhwIjoyMTA0NTAzNjcxfQ.CA8XmqBZ0R0Sc306c8uYR0NXX_Xja5YKoFs7sewMud0';

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const COLLEGE_A_ID = 'a0000000-0000-0000-0000-000000000001';
const COLLEGE_B_ID = 'b0000000-0000-0000-0000-000000000002';

async function setupMultiTenant() {
  console.log('=====================================================');
  console.log(' COGNIVA MULTI-TENANT COLLEGE PROVISIONING & SETUP');
  console.log('=====================================================');
  console.log(`Supabase Target: ${supabaseUrl}`);

  // 1. Provision Colleges
  console.log('\n1. PROVISIONING COLLEGES:');
  const colleges = [
    { id: COLLEGE_A_ID, code: 'COLLEGE_A', name: 'Cogniva Engineering College (College A)' },
    { id: COLLEGE_B_ID, code: 'COLLEGE_B', name: 'Test College 1' }
  ];

  for (const c of colleges) {
    try {
      const { error } = await adminClient.from('colleges').upsert([c], { onConflict: 'code' });
      if (error) console.log(`   Notice [colleges table]: ${error.message}`);
      else console.log(`   ✅ College provisioned: ${c.name} (${c.code} / ${c.id})`);
    } catch (e) {
      console.log(`   Notice [colleges table]: ${e.message}`);
    }
  }

  // 2. Provision Auth Users for College A and Test College 1 (College B)
  console.log('\n2. PROVISIONING MULTI-TENANT ADMIN USERS:');

  const usersToProvision = [
    {
      email: 'cdc@gmail.com',
      pass: 'cdc123',
      name: 'Academic Admin (CDC - College A)',
      role: 'admin',
      college_id: COLLEGE_A_ID,
      college_name: 'Cogniva Engineering College (College A)'
    },
    {
      email: 'hod@gmail.com',
      pass: 'hod123',
      name: 'Department Head (HOD - College A)',
      role: 'admin',
      college_id: COLLEGE_A_ID,
      college_name: 'Cogniva Engineering College (College A)'
    },
    {
      email: 'cdc1@gmail.com',
      pass: 'Cogniva@12345',
      name: 'Academic Admin (CDC - Test College 1)',
      role: 'admin',
      college_id: COLLEGE_B_ID,
      college_name: 'Test College 1'
    },
    {
      email: 'hod1@gmail.com',
      pass: 'Cogniva@12345',
      name: 'Department Head (HOD - Test College 1)',
      role: 'admin',
      college_id: COLLEGE_B_ID,
      college_name: 'Test College 1'
    }
  ];

  const { data: { users: existingAuthUsers } } = await adminClient.auth.admin.listUsers();
  const authMap = new Map((existingAuthUsers || []).map(u => [u.email.toLowerCase(), u]));

  for (const u of usersToProvision) {
    let authUser = authMap.get(u.email.toLowerCase());
    if (!authUser) {
      console.log(`   Creating Auth User: ${u.email}...`);
      const { data: created, error } = await adminClient.auth.admin.createUser({
        email: u.email,
        password: u.pass,
        email_confirm: true,
        user_metadata: {
          role: u.role,
          full_name: u.name,
          college_id: u.college_id,
          college_name: u.college_name
        }
      });
      if (error) {
        console.error(`   ❌ Failed to create user ${u.email}:`, error.message);
      } else {
        authUser = created.user;
        console.log(`   ✅ [CREATED AUTH] ${u.email} -> ${u.college_name}`);
      }
    } else {
      console.log(`   Updating Auth User: ${u.email}...`);
      await adminClient.auth.admin.updateUserById(authUser.id, {
        password: u.pass,
        email_confirm: true,
        user_metadata: {
          role: u.role,
          full_name: u.name,
          college_id: u.college_id,
          college_name: u.college_name
        }
      });
      console.log(`   ✅ [UPDATED AUTH] ${u.email} -> ${u.college_name}`);
    }

    if (authUser) {
      try {
        await adminClient.from('profiles').upsert([
          {
            id: authUser.id,
            user_id: authUser.id,
            email: u.email,
            full_name: u.name,
            role: u.role,
            college_id: u.college_id
          }
        ], { onConflict: 'email' });
      } catch (e) {
        console.log(`   Notice profiles update: ${e.message}`);
      }
    }
  }

  console.log('\n=====================================================');
  console.log(' MULTI-TENANT COLLEGE PROVISIONING COMPLETE');
  console.log('=====================================================');
}

setupMultiTenant().catch(console.error);
