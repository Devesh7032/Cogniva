import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileType, fileData, year, dept, section, subject } = req.body || {};

    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'Please select a valid PDF file.' });
    }

    const buffer = Buffer.from(fileData, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Please select a valid non-empty PDF file.' });
    }

    const cleanYear = (year || 'Second Year').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const cleanDept = (dept || 'CSE').replace(/[^a-zA-Z0-9]/g, '');
    const cleanSec = (section || 'CSE-C').replace(/[^a-zA-Z0-9]/g, '');
    const cleanSem = 'semester-4';
    const cleanSubj = (subject || 'DBMS').replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    const bucketName = 'study-materials';
    const storagePath = `${cleanYear}/${cleanDept}/${cleanSec}/${cleanSem}/${cleanSubj}/${uniqueId}-${sanitizedFileName}`;

    const { data, error } = await adminClient.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: fileType || 'application/pdf',
        upsert: false
      });

    if (error) {
      console.error('[VERCEL SERVERLESS STORAGE UPLOAD ERROR]:', error);
      return res.status(500).json({ error: error.message });
    }

    const { data: pubData } = adminClient.storage.from(bucketName).getPublicUrl(storagePath);

    return res.status(200).json({
      success: true,
      url: pubData.publicUrl,
      path: storagePath
    });
  } catch (err) {
    console.error('[VERCEL SERVERLESS UPLOAD EXCEPTION]:', err);
    return res.status(500).json({ error: err.message || 'Server upload failed' });
  }
}
