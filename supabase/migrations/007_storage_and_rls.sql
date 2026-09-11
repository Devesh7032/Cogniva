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
