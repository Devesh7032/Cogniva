-- ============================================================================
-- COGNIVA MIGRATION 007: ATTENDANCE, EXAMINATIONS & STUDY MATERIALS
-- ============================================================================

-- 1. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regno TEXT NOT NULL,
  student_name TEXT NOT NULL,
  faculty_email TEXT NOT NULL,
  year TEXT NOT NULL,
  department TEXT NOT NULL,
  section TEXT NOT NULL,
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EXAMINATIONS TABLE
CREATE TABLE IF NOT EXISTS public.examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  year TEXT NOT NULL,
  department TEXT NOT NULL,
  section TEXT NOT NULL,
  faculty_email TEXT NOT NULL,
  notice_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDY MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  year TEXT NOT NULL,
  department TEXT NOT NULL,
  section TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT,
  faculty_email TEXT NOT NULL,
  upload_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Attendance read policy" ON public.attendance_records;
CREATE POLICY "Attendance read policy" ON public.attendance_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Attendance write policy" ON public.attendance_records;
CREATE POLICY "Attendance write policy" ON public.attendance_records FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Examinations read policy" ON public.examinations;
CREATE POLICY "Examinations read policy" ON public.examinations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Examinations write policy" ON public.examinations;
CREATE POLICY "Examinations write policy" ON public.examinations FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Materials read policy" ON public.study_materials;
CREATE POLICY "Materials read policy" ON public.study_materials FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Materials write policy" ON public.study_materials;
CREATE POLICY "Materials write policy" ON public.study_materials FOR ALL TO authenticated USING (true);

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (7, '007_faculty_modules.sql')
ON CONFLICT (id) DO NOTHING;
