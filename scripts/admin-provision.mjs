import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2FjZmhtaWxxcnRqaml5emNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyNzY3MSwiZXhwIjoyMTA0NTAzNjcxfQ.CA8XmqBZ0R0Sc306c8uYR0NXX_Xja5YKoFs7sewMud0';

console.log('=====================================================');
console.log(' COGNIVA SERVER-SIDE ADMIN USER PROVISIONING');
console.log('=====================================================');

// Initialize privileged admin client (SERVER-SIDE ONLY)
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminAccounts = [
  { email: 'cdc@gmail.com', password: 'cdc123', full_name: 'CDC Administrator' },
  { email: 'hod@gmail.com', password: 'hod123', full_name: 'HOD Administrator' }
];

async function provisionAdminUsers() {
  for (const account of adminAccounts) {
    console.log(`\nProcessing Admin Account: ${account.email}`);

    // Check if user already exists in Auth
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    let authUser = users ? users.find(u => u.email === account.email) : null;

    if (!authUser) {
      console.log(`Creating auth user: ${account.email}...`);
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.full_name, role: 'admin' }
      });

      if (createError) {
        console.error(`Failed to create auth user ${account.email}:`, createError.message);
        continue;
      }
      authUser = createData.user;
      console.log(`[CREATED] Auth user created with ID: ${authUser.id}`);
    } else {
      console.log(`[EXISTS] Auth user already exists with ID: ${authUser.id}`);
      // Ensure password is set to prompt spec
      await adminClient.auth.admin.updateUserById(authUser.id, {
        password: account.password,
        email_confirm: true
      });
      console.log(`[UPDATED] Auth user password confirmed.`);
    }

    // Ensure profile row exists in public.profiles with role = 'admin'
    if (authUser) {
      const { data: existingProfile, error: profileCheckErr } = await adminClient
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!existingProfile) {
        console.log(`Creating profile row for ${account.email}...`);
        const { error: insertErr } = await adminClient
          .from('profiles')
          .insert([{
            user_id: authUser.id,
            email: account.email,
            role: 'admin',
            full_name: account.full_name
          }]);

        if (insertErr) {
          console.error(`Error inserting profile for ${account.email}:`, insertErr.message);
        } else {
          console.log(`[CREATED] Profile created with role = 'admin'.`);
        }
      } else {
        console.log(`[EXISTS] Profile already exists for ${account.email} with role: ${existingProfile.role}`);
        if (existingProfile.role !== 'admin') {
          await adminClient
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', existingProfile.id);
          console.log(`[UPDATED] Profile role updated to 'admin'.`);
        }
      }
    }
  }

  console.log('\n=====================================================');
  console.log(' SERVER-SIDE ADMIN USER PROVISIONING COMPLETE');
  console.log('=====================================================');
}

provisionAdminUsers().catch(err => {
  console.error('Provisioning error:', err);
});
