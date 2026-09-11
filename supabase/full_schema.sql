-- ============================================================================
-- COGNIVA MIGRATION 001: PROFILES & ROLES SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public._migrations (
  id INT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
  full_name TEXT,
  regno TEXT,
  section TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE (user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt() ->> 'email')) AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (1, '001_profiles.sql')
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- COGNIVA MIGRATION 002: ACADEMIC STRUCTURE (YEARS, DEPARTMENTS, SECTIONS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  order_index INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,
  capacity INT DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Academic Years
INSERT INTO public.academic_years (name, code, order_index)
VALUES
  ('First Year', '1YR', 1),
  ('Second Year', '2YR', 2),
  ('Third Year', '3YR', 3),
  ('Fourth Year', '4YR', 4)
ON CONFLICT (name) DO NOTHING;

-- Seed Initial Departments
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
      ON CONFLICT (name) DO NOTHING;
    END LOOP;
  END IF;
END $$;

INSERT INTO public._migrations (id, name)
VALUES (2, '002_academic_structure.sql')
ON CONFLICT (id) DO NOTHING;


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


-- ============================================================================
-- COGNIVA MIGRATION 006: NOTICES, ASSIGNMENTS, STUDY MATERIALS & STUDENT GOALS
-- ============================================================================

-- 1. NOTICES / ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.notices (
  id TEXT PRIMARY KEY DEFAULT ('notice_' || md5(random()::text)),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Faculty Member',
  faculty_email TEXT NOT NULL,
  department TEXT DEFAULT 'CSE',
  section TEXT NOT NULL DEFAULT 'ALL',
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Urgent', 'Important', 'Normal')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TEXT,
  attachment_url TEXT,
  attachment_path TEXT,
  read_by JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COURSE ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY DEFAULT ('asgn_' || md5(random()::text)),
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  academic_year TEXT DEFAULT 'Second Year',
  department TEXT DEFAULT 'CSE',
  section TEXT NOT NULL DEFAULT 'CSE-C',
  faculty_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  max_marks INT DEFAULT 10,
  attachment_url TEXT,
  attachment_path TEXT,
  priority TEXT DEFAULT 'Medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || md5(random()::text)),
  assignment_id TEXT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id TEXT,
  regno TEXT NOT NULL,
  student_name TEXT,
  student_email TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  file_url TEXT,
  file_path TEXT,
  response_text TEXT,
  status TEXT DEFAULT 'SUBMITTED',
  marks INT,
  grade TEXT,
  feedback TEXT,
  graded_by TEXT,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_assignment_student UNIQUE (assignment_id, regno)
);

CREATE TABLE IF NOT EXISTS public.student_assignment_status (
  id TEXT PRIMARY KEY DEFAULT ('sas_' || md5(random()::text)),
  assignment_id TEXT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id TEXT,
  regno TEXT NOT NULL,
  student_email TEXT NOT NULL,
  status TEXT DEFAULT 'COMPLETED',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_assignment_status UNIQUE (assignment_id, regno)
);

-- 3. STUDY MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.study_materials (
  id TEXT PRIMARY KEY DEFAULT ('mat_' || md5(random()::text)),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  year TEXT DEFAULT 'Second Year',
  department TEXT DEFAULT 'CSE',
  section TEXT NOT NULL DEFAULT 'CSE-C',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT,
  storage_bucket TEXT DEFAULT 'study-materials',
  file_type TEXT,
  file_size BIGINT,
  faculty_email TEXT NOT NULL,
  upload_date TEXT DEFAULT NOW()::text,
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STUDENT GOALS TABLE
CREATE TABLE IF NOT EXISTS public.student_goals (
  id TEXT PRIMARY KEY DEFAULT ('goal_' || md5(random()::text)),
  student_email TEXT NOT NULL,
  regno TEXT,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Academic',
  target_date TEXT,
  progress INT DEFAULT 0,
  status TEXT DEFAULT 'In Progress',
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDENT OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.student_opportunities (
  id TEXT PRIMARY KEY DEFAULT ('opp_' || md5(random()::text)),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Internship',
  location TEXT,
  deadline TEXT,
  description TEXT,
  link TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public._migrations (id, name)
VALUES (6, '006_communications_and_materials.sql')
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- COGNIVA MIGRATION 006: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_section_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles self edit policy" ON public.profiles;
CREATE POLICY "Profiles self edit policy" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Profiles admin write policy" ON public.profiles;
CREATE POLICY "Profiles admin write policy" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin());

-- 2. Academic Structure Policies (Years, Departments, Sections)
DROP POLICY IF EXISTS "Academic structure read policy" ON public.academic_years;
CREATE POLICY "Academic structure read policy" ON public.academic_years
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Academic structure admin policy" ON public.academic_years;
CREATE POLICY "Academic structure admin policy" ON public.academic_years
  FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Departments read policy" ON public.departments;
CREATE POLICY "Departments read policy" ON public.departments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Departments admin policy" ON public.departments;
CREATE POLICY "Departments admin policy" ON public.departments
  FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Sections read policy" ON public.sections;
CREATE POLICY "Sections read policy" ON public.sections
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Sections admin policy" ON public.sections;
CREATE POLICY "Sections admin policy" ON public.sections
  FOR ALL TO authenticated USING (public.is_admin());

-- 3. Faculty Assignments Policies (Faculty can only access assigned sections)
DROP POLICY IF EXISTS "Faculty assignments read policy" ON public.faculty_assignments;
CREATE POLICY "Faculty assignments read policy" ON public.faculty_assignments
  FOR SELECT TO authenticated USING (
    public.is_admin() OR
    faculty_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Faculty assignments admin policy" ON public.faculty_assignments;
CREATE POLICY "Faculty assignments admin policy" ON public.faculty_assignments
  FOR ALL TO authenticated USING (public.is_admin());

-- 4. Student Assignments Policies (Students read own info; Faculty read assigned section students; Admin all)
DROP POLICY IF EXISTS "Student assignments read policy" ON public.student_assignments;
CREATE POLICY "Student assignments read policy" ON public.student_assignments
  FOR SELECT TO authenticated USING (
    public.is_admin() OR
    student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    section_id IN (
      SELECT fa.section_id FROM public.faculty_assignments fa
      JOIN public.profiles p ON fa.faculty_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Student assignments admin policy" ON public.student_assignments;
CREATE POLICY "Student assignments admin policy" ON public.student_assignments
  FOR ALL TO authenticated USING (public.is_admin());

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (6, '006_rls.sql')
ON CONFLICT (id) DO NOTHING;


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


-- ============================================================================
-- COGNIVA MIGRATION 007: STORAGE BUCKETS & PRODUCTION RLS POLICIES
-- ============================================================================

-- 1. Enable RLS on all Cogniva public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_section_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_import_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grade_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_import_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_cgpa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgpa_import_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignment_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_opportunities ENABLE ROW LEVEL SECURITY;

-- Create helper RLS policies for authenticated users
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'profiles', 'academic_years', 'departments', 'sections', 'faculty', 'faculty_details',
    'students', 'student_details', 'faculty_assignments', 'faculty_section_access', 'student_assignments',
    'subjects', 'faculty_subject_assignments', 'timetable_entries', 'attendance_records',
    'student_attendance_summary', 'attendance_import_datasets', 'examinations', 'exam_results',
    'student_grades', 'student_grade_summary', 'grade_import_datasets', 'student_cgpa_records',
    'cgpa_import_datasets', 'notices', 'assignments', 'assignment_submissions',
    'student_assignment_status', 'study_materials', 'student_goals', 'student_opportunities'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated read on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow authenticated read on %I" ON public.%I FOR SELECT TO authenticated USING (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated insert on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow authenticated insert on %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated update on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow authenticated update on %I" ON public.%I FOR UPDATE TO authenticated USING (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated delete on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow authenticated delete on %I" ON public.%I FOR DELETE TO authenticated USING (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Allow anon read on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow anon read on %I" ON public.%I FOR SELECT TO anon USING (true)', tbl, tbl);
  END LOOP;
END $$;

-- 2. SUPABASE STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('study-materials', 'study-materials', true),
  ('notices', 'notices', true),
  ('assignments', 'assignments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
CREATE POLICY "Public Storage Read" ON storage.objects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Storage Write" ON storage.objects;
CREATE POLICY "Authenticated Storage Write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Storage Update" ON storage.objects;
CREATE POLICY "Authenticated Storage Update" ON storage.objects FOR UPDATE TO authenticated USING (true);

INSERT INTO public._migrations (id, name)
VALUES (7, '007_storage_and_rls.sql')
ON CONFLICT (id) DO NOTHING;


