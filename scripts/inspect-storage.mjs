import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function inspectStorage() {
  console.log('=====================================================');
  console.log(' COGNIVA SUPABASE STORAGE & MATERIALS INSPECTION');
  console.log('=====================================================');

  // 1. List buckets
  const { data: buckets, error: bErr } = await adminClient.storage.listBuckets();
  console.log('\n--- Existing Storage Buckets ---');
  if (bErr) {
    console.error('Error listing buckets:', bErr.message);
  } else {
    console.log(buckets.map(b => ({ id: b.id, name: b.name, public: b.public })));
  }

  // 2. Ensure 'study-materials', 'materials', 'notices' buckets exist and are public
  const targetBuckets = ['study-materials', 'materials', 'notices'];
  for (const bName of targetBuckets) {
    const found = buckets?.find(b => b.name === bName || b.id === bName);
    if (!found) {
      console.log(`Creating public bucket '${bName}'...`);
      const { error: cErr } = await adminClient.storage.createBucket(bName, { public: true });
      if (cErr) {
        console.error(`Error creating bucket '${bName}':`, cErr.message);
      } else {
        console.log(`[BUCKET CREATED] '${bName}' is ready and public.`);
      }
    } else {
      console.log(`Bucket '${bName}' already exists.`);
    }
  }

  // 3. Inspect study_materials database table
  console.log('\n--- Existing study_materials Database Records ---');
  const { data: matRows, error: mErr } = await adminClient.from('study_materials').select('*');
  if (mErr) {
    console.error('Error querying study_materials table:', mErr.message);
  } else {
    console.log(`Found ${matRows?.length || 0} material records:`);
    console.log(matRows);
  }
}

inspectStorage().catch(console.error);
