-- ============================================================================
-- COGNIVA MIGRATION 003: FACULTY STRUCTURE & DETAILED ATTRIBUTES
-- ============================================================================

-- Standalone Faculty table
CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  dob TEXT,
  department TEXT,
  year TEXT,
  section TEXT,
  subject TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extended Faculty Details table
CREATE TABLE IF NOT EXISTS public.faculty_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  dob TEXT,
  department TEXT,
  year TEXT,
  section TEXT,
  subject TEXT,
  designation TEXT DEFAULT 'Faculty Member',
  qualification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Faculty read policy" ON public.faculty;
CREATE POLICY "Faculty read policy" ON public.faculty FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Faculty write policy" ON public.faculty;
CREATE POLICY "Faculty write policy" ON public.faculty FOR ALL TO authenticated USING (true);

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (3, '003_faculty.sql')
ON CONFLICT (id) DO NOTHING;
