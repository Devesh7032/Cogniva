-- ============================================================================
-- COGNIVA MIGRATION 005: ASSIGNMENTS (FACULTY & STUDENT)
-- ============================================================================

-- 1. FACULTY SECTION ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.faculty_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_faculty_section_assignment UNIQUE (faculty_id, section_id)
);

-- Alias table name if existing code uses faculty_section_assignments
CREATE TABLE IF NOT EXISTS public.faculty_section_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_faculty_sec_assignment UNIQUE (faculty_id, section_id)
);

-- 2. STUDENT ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  section_id UUID NOT NULL REFERENCES public.sections(id),
  roll_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_assignment UNIQUE (student_id)
);

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (5, '005_assignments.sql')
ON CONFLICT (id) DO NOTHING;
