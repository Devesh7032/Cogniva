-- ============================================================================
-- COGNIVA MIGRATION 004: STUDENT STRUCTURE
-- ============================================================================

-- Standalone Students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regno TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  year TEXT,
  semester TEXT,
  section TEXT,
  dob TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE,
  admission_year INT,
  guardian_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students read policy" ON public.students;
CREATE POLICY "Students read policy" ON public.students FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Students write policy" ON public.students;
CREATE POLICY "Students write policy" ON public.students FOR ALL TO authenticated USING (true);

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (4, '004_students.sql')
ON CONFLICT (id) DO NOTHING;
