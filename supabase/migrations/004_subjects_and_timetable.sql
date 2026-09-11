-- ============================================================================
-- COGNIVA MIGRATION 004: SUBJECTS & TIMETABLE STRUCTURE
-- ============================================================================

-- 1. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY DEFAULT ('subj_' || md5(random()::text)),
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'CSE',
  academic_year TEXT NOT NULL DEFAULT 'Second Year',
  section TEXT NOT NULL DEFAULT 'CSE-C',
  semester TEXT DEFAULT '4',
  credits INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FACULTY SUBJECT ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.faculty_subject_assignments (
  id TEXT PRIMARY KEY DEFAULT ('fsa_' || md5(random()::text)),
  faculty_id TEXT,
  faculty_email TEXT NOT NULL,
  subject_id TEXT,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  academic_year TEXT DEFAULT 'Second Year',
  department TEXT DEFAULT 'CSE',
  section TEXT NOT NULL DEFAULT 'CSE-C',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TIMETABLE ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id TEXT PRIMARY KEY DEFAULT ('tt_' || md5(random()::text)),
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  period INT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject TEXT NOT NULL,
  subject_code TEXT,
  faculty TEXT NOT NULL,
  faculty_email TEXT,
  room TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'CSE-C',
  department TEXT DEFAULT 'CSE',
  academic_year TEXT DEFAULT 'Second Year',
  semester TEXT DEFAULT '4',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public._migrations (id, name)
VALUES (4, '004_subjects_and_timetable.sql')
ON CONFLICT (id) DO NOTHING;
