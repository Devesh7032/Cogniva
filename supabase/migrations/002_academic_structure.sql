-- ============================================================================
-- COGNIVA MIGRATION 002: ACADEMIC STRUCTURE (YEARS, DEPARTMENTS, SECTIONS)
-- ============================================================================

-- 1. ACADEMIC YEARS TABLE
CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  order_index INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_section_per_dept_year UNIQUE (academic_year_id, department_id, name)
);

-- Initial Academic Years Seed Data (Idempotent)
INSERT INTO public.academic_years (name, code, order_index)
VALUES
  ('First Year', '1YR', 1),
  ('Second Year', '2YR', 2),
  ('Third Year', '3YR', 3),
  ('Fourth Year', '4YR', 4)
ON CONFLICT (name) DO NOTHING;

-- Initial Departments Seed Data (Idempotent)
INSERT INTO public.departments (name, code)
VALUES
  ('Computer Science & Engineering', 'CSE'),
  ('Electronics & Communication', 'ECE'),
  ('AI & Data Science', 'AI&DS'),
  ('Mechanical Engineering', 'ME')
ON CONFLICT (code) DO NOTHING;

-- Seed sections CSE-A through CSE-J for Second Year CSE
DO $$
DECLARE
  v_year_id UUID;
  v_dept_id UUID;
  sec_name TEXT;
  sec_list TEXT[] := ARRAY['CSE-A', 'CSE-B', 'CSE-C', 'CSE-D', 'CSE-E', 'CSE-F', 'CSE-G', 'CSE-H', 'CSE-I', 'CSE-J'];
BEGIN
  SELECT id INTO v_year_id FROM public.academic_years WHERE code = '2YR' LIMIT 1;
  SELECT id INTO v_dept_id FROM public.departments WHERE code = 'CSE' LIMIT 1;

  IF v_year_id IS NOT NULL AND v_dept_id IS NOT NULL THEN
    FOREACH sec_name IN ARRAY sec_list LOOP
      INSERT INTO public.sections (academic_year_id, department_id, name, capacity)
      VALUES (v_year_id, v_dept_id, sec_name, 60)
      ON CONFLICT (academic_year_id, department_id, name) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (2, '002_academic_structure.sql')
ON CONFLICT (id) DO NOTHING;
