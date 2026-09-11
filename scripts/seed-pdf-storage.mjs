import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

function buildValidPdf(title, subtitle, contentLines) {
  const objects = [];
  
  // Obj 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  // Obj 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  // Obj 3: Page
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
  // Obj 4: Font
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  // Stream content
  let streamText = 'BT\n/F1 22 Tf\n50 720 Td\n(' + title + ') Tj\n0 -35 Td\n/F1 14 Tf\n(' + subtitle + ') Tj\n';
  contentLines.forEach(line => {
    streamText += '0 -25 Td\n/F1 12 Tf\n(' + line + ') Tj\n';
  });
  streamText += 'ET\n';

  const streamLen = Buffer.byteLength(streamText, 'utf-8');
  objects.push('5 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + streamText + 'endstream\nendobj\n');

  let pdfStr = '%PDF-1.4\n%\xFF\xFF\xFF\xFF\n';
  const offsets = [0];

  objects.forEach(obj => {
    offsets.push(Buffer.byteLength(pdfStr, 'utf-8'));
    pdfStr += obj;
  });

  const startXref = Buffer.byteLength(pdfStr, 'utf-8');
  let xref = 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const offStr = offsets[i].toString().padStart(10, '0');
    xref += offStr + ' 00000 n \n';
  }

  xref += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + startXref + '\n%%EOF\n';
  pdfStr += xref;

  return Buffer.from(pdfStr, 'utf-8');
}

const samplePdfBinary = buildValidPdf(
  'COGNIVA STUDENT INTELLIGENCE PLATFORM',
  'Subject: DBMS | Unit 4: Normalization & Relational Decomposition',
  [
    '1. First Normal Form (1NF): Eliminates repeating groups and ensures atomic attributes.',
    '2. Second Normal Form (2NF): Eliminates partial functional dependencies.',
    '3. Third Normal Form (3NF): Eliminates transitive functional dependencies.',
    '4. Boyce-Codd Normal Form (BCNF): Strict version of 3NF for every dependency X -> Y.',
    '5. Lossless Join & Dependency Preservation: Key decomposition properties.'
  ]
);

async function seedPdfToStorage() {
  console.log('=====================================================');
  console.log(' SEEDING REAL VALID PDF FILE TO SUPABASE STORAGE');
  console.log('=====================================================');

  const bucketName = 'study-materials';

  // 1. Ensure bucket exists and is public
  const { data: buckets } = await adminClient.storage.listBuckets();
  let bucket = buckets?.find(b => b.name === bucketName || b.id === bucketName);
  if (!bucket) {
    console.log(`Creating public bucket '${bucketName}'...`);
    await adminClient.storage.createBucket(bucketName, { public: true });
  }

  // 2. Upload file to multiple path variants so any path resolution works
  const pathsToUpload = [
    'UNIT 4.pdf',
    'UNIT_4.pdf',
    'normalization_unit3.pdf',
    'Second_Year/CSE/CSE-C/DBMS/UNIT_4.pdf'
  ];

  for (const filePath of pathsToUpload) {
    console.log(`Uploading PDF binary to '${bucketName}/${filePath}'...`);
    const { data, error } = await adminClient.storage
      .from(bucketName)
      .upload(filePath, samplePdfBinary, {
        upsert: true,
        contentType: 'application/pdf'
      });

    if (error) {
      console.error(`Failed to upload '${filePath}':`, error.message);
    } else {
      const { data: pubUrl } = adminClient.storage.from(bucketName).getPublicUrl(filePath);
      console.log(`[SUCCESS] Uploaded to '${filePath}' -> Public URL: ${pubUrl.publicUrl}`);
    }
  }

  // 3. Upsert database record into study_materials table
  const publicUrl = adminClient.storage.from(bucketName).getPublicUrl('UNIT 4.pdf').data.publicUrl;

  const matRecord = {
    id: 'mat_csec_001',
    title: 'Normalization & Relational Decomposition - Unit 3',
    subject: 'DBMS',
    description: 'Detailed lecture slides and practice problems on 1NF, 2NF, 3NF, BCNF and lossless join decomposition.',
    year: 'Second Year',
    department: 'CSE',
    section: 'CSE-C',
    file_name: 'UNIT 4.pdf',
    file_url: publicUrl,
    file_path: 'UNIT 4.pdf',
    storage_bucket: 'study-materials',
    faculty_email: 'anjali.menon@example.edu',
    upload_date: '2026-09-09',
    due_date: '2026-09-15'
  };

  try {
    const { error: dbErr } = await adminClient.from('study_materials').upsert([matRecord], { onConflict: 'id' });
    if (dbErr) {
      console.log('Database upsert note:', dbErr.message);
    } else {
      console.log('[DATABASE] Study material record updated with public Storage URL!');
    }
  } catch (e) {
    console.log('Database exception:', e.message);
  }

  console.log('\n=====================================================');
  console.log(' PDF STORAGE SEEDING COMPLETE');
  console.log('=====================================================');
}

seedPdfToStorage().catch(console.error);
