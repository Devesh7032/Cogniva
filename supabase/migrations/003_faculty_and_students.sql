-- ============================================================================
-- COGNIVA MIGRATION 003: FACULTY & STUDENTS DATA MODELS
-- ============================================================================

-- 1. STANDALONE FACULTY TABLE
CREATE TABLE IF NOT EXISTS public.faculty (
  id TEXT PRIMARY KEY DEFAULT ('fac_' || md5(random()::text)),
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

-- 2. EXTENDED FACULTY DETAILS TABLE
CREATE TABLE IF NOT EXISTS public.faculty_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- 3. STANDALONE STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY DEFAULT ('stud_' || md5(random()::text)),
  auth_user_id UUID,
  regno TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT DEFAULT 'CSE',
  year TEXT DEFAULT 'Second Year',
  semester TEXT DEFAULT '4',
  section TEXT DEFAULT 'CSE-C',
  dob TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXTENDED STUDENT DETAILS TABLE
CREATE TABLE IF NOT EXISTS public.student_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE,
  admission_year INT,
  guardian_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FACULTY ASSIGNMENTS & ACCESS CONTROL TABLES
CREATE TABLE IF NOT EXISTS public.faculty_assignments (
  id TEXT PRIMARY KEY DEFAULT ('fa_' || md5(random()::text)),
  faculty_id TEXT,
  faculty_email TEXT NOT NULL,
  faculty_name TEXT,
  academic_year TEXT,
  department_code TEXT,
  section_id TEXT,
  section_name TEXT NOT NULL,
  subject_code TEXT,
  subject_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faculty_section_access (
  id TEXT PRIMARY KEY DEFAULT ('fsa_' || md5(random()::text)),
  faculty_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_faculty_section_access UNIQUE (faculty_id, section_id)
);

CREATE TABLE IF NOT EXISTS public.student_assignments (
  id TEXT PRIMARY KEY DEFAULT ('sa_' || md5(random()::text)),
  student_id TEXT,
  student_email TEXT NOT NULL,
  academic_year_id TEXT,
  department_id TEXT,
  section_id TEXT NOT NULL,
  roll_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public._migrations (id, name)
VALUES (3, '003_faculty_and_students.sql')
ON CONFLICT (id) DO NOTHING;
