import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtoacfhmilqrtjjiyzci.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function createTables() {
  console.log('=====================================================');
  console.log(' CREATING SUPABASE TABLES VIA SQL & RPC');
  console.log('=====================================================');

  const sqlStatements = `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY,
      user_id UUID,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.students (
      id TEXT PRIMARY KEY,
      auth_user_id UUID,
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

    CREATE TABLE IF NOT EXISTS public.study_materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      year TEXT,
      department TEXT,
      section TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_path TEXT NOT NULL,
      storage_bucket TEXT DEFAULT 'study-materials',
      file_type TEXT,
      file_size BIGINT,
      faculty_email TEXT NOT NULL,
      upload_date TEXT,
      due_date TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.examinations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      description TEXT,
      instructions TEXT,
      year TEXT,
      department TEXT,
      section TEXT NOT NULL,
      notice_image_url TEXT,
      faculty_email TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.attendance_records (
      id TEXT PRIMARY KEY,
      regno TEXT NOT NULL,
      student_name TEXT,
      faculty_email TEXT NOT NULL,
      year TEXT,
      department TEXT,
      section TEXT NOT NULL,
      subject TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.subjects (
      id TEXT PRIMARY KEY,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      department TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      section TEXT NOT NULL,
      semester TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.faculty_subject_assignments (
      id TEXT PRIMARY KEY,
      faculty_id TEXT,
      faculty_email TEXT NOT NULL,
      subject_id TEXT,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      department TEXT NOT NULL,
      section TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.grades (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      regno TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      academic_year TEXT,
      department TEXT,
      section TEXT NOT NULL,
      internal INT DEFAULT 0,
      assignment INT DEFAULT 0,
      exam INT DEFAULT 0,
      total INT DEFAULT 0,
      grade TEXT DEFAULT 'F',
      faculty_email TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.assignments (
      id TEXT PRIMARY KEY,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      academic_year TEXT,
      department TEXT,
      section TEXT NOT NULL,
      faculty_email TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assigned_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      max_marks INT DEFAULT 10,
      attachment_url TEXT,
      attachment_path TEXT,
      priority TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.assignment_submissions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL,
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
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL,
      student_id TEXT,
      regno TEXT NOT NULL,
      student_email TEXT NOT NULL,
      status TEXT DEFAULT 'COMPLETED',
      completed_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_assignment_status UNIQUE (assignment_id, regno)
    );

    ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.faculty_subject_assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.student_assignment_status ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public access for assignments" ON public.assignments;
    CREATE POLICY "Public access for assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access for assignment_submissions" ON public.assignment_submissions;
    CREATE POLICY "Public access for assignment_submissions" ON public.assignment_submissions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access for student_assignment_status" ON public.student_assignment_status;
    CREATE POLICY "Public access for student_assignment_status" ON public.student_assignment_status FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public read access for study_materials" ON public.study_materials;
    CREATE POLICY "Public read access for study_materials" ON public.study_materials FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public insert access for study_materials" ON public.study_materials;
    CREATE POLICY "Public insert access for study_materials" ON public.study_materials FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Public update access for study_materials" ON public.study_materials;
    CREATE POLICY "Public update access for study_materials" ON public.study_materials FOR UPDATE USING (true);

    DROP POLICY IF EXISTS "Public read access for examinations" ON public.examinations;
    CREATE POLICY "Public read access for examinations" ON public.examinations FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public insert access for examinations" ON public.examinations;
    CREATE POLICY "Public insert access for examinations" ON public.examinations FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Public read access for attendance_records" ON public.attendance_records;
    CREATE POLICY "Public read access for attendance_records" ON public.attendance_records FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public insert access for attendance_records" ON public.attendance_records;
    CREATE POLICY "Public insert access for attendance_records" ON public.attendance_records FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Public update access for attendance_records" ON public.attendance_records;
    CREATE POLICY "Public update access for attendance_records" ON public.attendance_records FOR UPDATE USING (true);

    DROP POLICY IF EXISTS "Public read access for students" ON public.students;
    CREATE POLICY "Public read access for students" ON public.students FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public insert access for students" ON public.students;
    CREATE POLICY "Public insert access for students" ON public.students FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Public update access for students" ON public.students;
    CREATE POLICY "Public update access for students" ON public.students FOR UPDATE USING (true);
  `;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ query: sqlStatements })
    });
    console.log('RPC exec_sql HTTP status:', res.status);
  } catch (e) {
    console.log('Direct SQL exec error:', e.message);
  }
}

createTables().catch(console.error);
