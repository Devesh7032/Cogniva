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
