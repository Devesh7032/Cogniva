-- ============================================================================
-- COGNIVA MIGRATION 011: FIX STORAGE RLS POLICIES FOR PUBLIC BUCKETS
-- ============================================================================

-- 1. Ensure Storage Buckets Exist & Are Configured Public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('study-materials', 'study-materials', true, 52428800, ARRAY['application/pdf']),
  ('notices', 'notices', true, 52428800, NULL),
  ('assignments', 'assignments', true, 52428800, NULL),
  ('materials', 'materials', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE 
SET public = true, file_size_limit = 52428800;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Clean up conflicting legacy storage policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 4. Create Public & Authenticated Read Policy (SELECT)
CREATE POLICY "Cogniva Public Storage Select Policy"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('study-materials', 'notices', 'assignments', 'materials'));

-- 5. Create Public & Authenticated Write Policy (INSERT)
CREATE POLICY "Cogniva Storage Insert Policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('study-materials', 'notices', 'assignments', 'materials'));

-- 6. Create Public & Authenticated Update Policy (UPDATE)
CREATE POLICY "Cogniva Storage Update Policy"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('study-materials', 'notices', 'assignments', 'materials'));

-- 7. Create Public & Authenticated Delete Policy (DELETE)
CREATE POLICY "Cogniva Storage Delete Policy"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('study-materials', 'notices', 'assignments', 'materials'));

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (11, '011_fix_storage_rls_policies.sql')
ON CONFLICT (id) DO NOTHING;
