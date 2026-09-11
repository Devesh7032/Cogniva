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
