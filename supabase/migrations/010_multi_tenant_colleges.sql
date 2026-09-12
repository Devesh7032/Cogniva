-- ============================================================================
-- COGNIVA MIGRATION 010: MULTI-COLLEGE / MULTI-TENANT DATA ISOLATION
-- ============================================================================

-- 1. COLLEGES TABLE
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Primary Colleges
INSERT INTO public.colleges (id, code, name)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'COLLEGE_A', 'Cogniva Engineering College (College A)'),
  ('b0000000-0000-0000-0000-000000000002', 'COLLEGE_B', 'Test College 1')
ON CONFLICT (code) DO NOTHING;

-- 2. ADD college_id TO ALL TENANT TABLES
DO $$
DECLARE
  college_a_id UUID := 'a0000000-0000-0000-0000-000000000001';
BEGIN
  -- Profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='college_id') THEN
    ALTER TABLE public.profiles ADD COLUMN college_id UUID REFERENCES public.colleges(id);
  END IF;
  UPDATE public.profiles SET college_id = college_a_id WHERE college_id IS NULL;

  -- Students
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='students') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='college_id') THEN
      ALTER TABLE public.students ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.students SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Faculty
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='faculty') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faculty' AND column_name='college_id') THEN
      ALTER TABLE public.faculty ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.faculty SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Departments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='departments') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='college_id') THEN
      ALTER TABLE public.departments ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.departments SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Sections
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='sections') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sections' AND column_name='college_id') THEN
      ALTER TABLE public.sections ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.sections SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Subjects
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='subjects') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='college_id') THEN
      ALTER TABLE public.subjects ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.subjects SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Attendance Records
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='attendance_records') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_records' AND column_name='college_id') THEN
      ALTER TABLE public.attendance_records ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.attendance_records SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Student Grades
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='student_grades') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_grades' AND column_name='college_id') THEN
      ALTER TABLE public.student_grades ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.student_grades SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Grades
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='grades') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grades' AND column_name='college_id') THEN
      ALTER TABLE public.grades ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.grades SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Assignments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='assignments') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='college_id') THEN
      ALTER TABLE public.assignments ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.assignments SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Examinations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='examinations') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='examinations' AND column_name='college_id') THEN
      ALTER TABLE public.examinations ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.examinations SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Study Materials
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='study_materials') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_materials' AND column_name='college_id') THEN
      ALTER TABLE public.study_materials ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.study_materials SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Student Queries
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='student_queries') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_queries' AND column_name='college_id') THEN
      ALTER TABLE public.student_queries ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.student_queries SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;

  -- Notifications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notifications') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='college_id') THEN
      ALTER TABLE public.notifications ADD COLUMN college_id UUID REFERENCES public.colleges(id);
    END IF;
    UPDATE public.notifications SET college_id = college_a_id WHERE college_id IS NULL;
  END IF;
END $$;

-- 3. HELPER FUNCTION TO GET AUTHENTICATED USER'S COLLEGE_ID
CREATE OR REPLACE FUNCTION public.get_current_user_college_id()
RETURNS UUID AS $$
DECLARE
  v_college_id UUID;
BEGIN
  SELECT college_id INTO v_college_id
  FROM public.profiles
  WHERE (user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt() ->> 'email'))
  LIMIT 1;

  IF v_college_id IS NULL THEN
    v_college_id := 'a0000000-0000-0000-0000-000000000001'::UUID;
  END IF;

  RETURN v_college_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ENABLE RLS POLICIES FOR TENANT ISOLATION
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read colleges" ON public.colleges;
CREATE POLICY "Authenticated users can read colleges" ON public.colleges FOR SELECT USING (true);

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (10, '010_multi_tenant_colleges.sql')
ON CONFLICT (id) DO NOTHING;
