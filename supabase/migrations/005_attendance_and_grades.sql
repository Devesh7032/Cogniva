-- ============================================================================
-- COGNIVA MIGRATION 005: ATTENDANCE, GRADES, EXAMINATIONS & CGPA
-- ============================================================================

-- 1. ATTENDANCE RECORDS (DAILY SLOTS)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY DEFAULT ('att_' || md5(random()::text)),
  regno TEXT NOT NULL,
  student_name TEXT,
  faculty_email TEXT NOT NULL,
  year TEXT DEFAULT 'Second Year',
  department TEXT DEFAULT 'CSE',
  section TEXT NOT NULL DEFAULT 'CSE-C',
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'On Leave')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STUDENT ATTENDANCE SUMMARY TABLE
CREATE TABLE IF NOT EXISTS public.student_attendance_summary (
  id TEXT PRIMARY KEY DEFAULT ('att_sum_' || md5(random()::text)),
  regno TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  department TEXT DEFAULT 'CSE',
  section TEXT NOT NULL DEFAULT 'CSE-C',
  overall_attendance INT DEFAULT 85,
  subjects JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_import_datasets (
  id TEXT PRIMARY KEY DEFAULT ('att_ds_' || md5(random()::text)),
  file_name TEXT NOT NULL,
  faculty_email TEXT NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  headers JSONB DEFAULT '[]'::jsonb,
  subject_headers JSONB DEFAULT '[]'::jsonb,
  records JSONB DEFAULT '[]'::jsonb
);

-- 3. EXAMINATIONS TABLE
CREATE TABLE IF NOT EXISTS public.examinations (
  id TEXT PRIMARY KEY DEFAULT ('exam_' || md5(random()::text)),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  description TEXT,
  instructions TEXT,
  year TEXT DEFAULT 'Second Year',
  department TEXT DEFAULT 'CSE',
  section TEXT NOT NULL DEFAULT 'CSE-C',
  notice_image_url TEXT,
  faculty_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXAM RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.exam_results (
  id TEXT PRIMARY KEY DEFAULT ('res_' || md5(random()::text)),
  regno TEXT NOT NULL,
  student_name TEXT,
  exam_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  marks_obtained NUMERIC(5,2) NOT NULL,
  max_marks NUMERIC(5,2) DEFAULT 100,
  faculty_email TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'CSE-C',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDENT GRADES (DETAILED MARKS & SUMMARY)
CREATE TABLE IF NOT EXISTS public.student_grades (
  id TEXT PRIMARY KEY DEFAULT ('grade_' || md5(random()::text)),
  student_id TEXT,
  regno TEXT NOT NULL,
  student_name TEXT,
  student_email TEXT,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  academic_year TEXT DEFAULT 'Second Year',
  department TEXT DEFAULT 'CSE',
  section TEXT NOT NULL DEFAULT 'CSE-C',
  internal INT DEFAULT 0,
  assignment INT DEFAULT 0,
  exam INT DEFAULT 0,
  total INT DEFAULT 0,
  grade TEXT DEFAULT 'F',
  faculty_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_grade_summary (
  id TEXT PRIMARY KEY DEFAULT ('grd_sum_' || md5(random()::text)),
  regno TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  department TEXT DEFAULT 'CSE',
  section TEXT NOT NULL DEFAULT 'CSE-C',
  subjects JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grade_import_datasets (
  id TEXT PRIMARY KEY DEFAULT ('grd_ds_' || md5(random()::text)),
  file_name TEXT NOT NULL,
  faculty_email TEXT NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  headers JSONB DEFAULT '[]'::jsonb,
  subject_headers JSONB DEFAULT '[]'::jsonb,
  records JSONB DEFAULT '[]'::jsonb
);

-- 6. STUDENT CGPA & SGPA RECORDS
CREATE TABLE IF NOT EXISTS public.student_cgpa_records (
  id TEXT PRIMARY KEY DEFAULT ('cgpa_' || md5(random()::text)),
  regno TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  department TEXT DEFAULT 'CSE',
  semester TEXT DEFAULT '4',
  section TEXT NOT NULL DEFAULT 'CSE-C',
  faculty_email TEXT,
  semesters JSONB DEFAULT '[]'::jsonb,
  current_cgpa NUMERIC(4,2),
  latest_sgpa NUMERIC(4,2),
  previous_sgpa NUMERIC(4,2),
  best_sgpa NUMERIC(4,2),
  lowest_sgpa NUMERIC(4,2),
  average_sgpa NUMERIC(4,2),
  trend TEXT DEFAULT 'stable',
  sgpa_delta NUMERIC(4,2),
  cgpa_delta NUMERIC(4,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cgpa_import_datasets (
  id TEXT PRIMARY KEY DEFAULT ('cgpa_ds_' || md5(random()::text)),
  file_name TEXT NOT NULL,
  faculty_email TEXT NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  headers JSONB DEFAULT '[]'::jsonb,
  reg_no_header TEXT,
  name_header TEXT,
  sem_headers JSONB DEFAULT '[]'::jsonb,
  cgpa_header TEXT,
  records JSONB DEFAULT '[]'::jsonb
);

INSERT INTO public._migrations (id, name)
VALUES (5, '005_attendance_and_grades.sql')
ON CONFLICT (id) DO NOTHING;
