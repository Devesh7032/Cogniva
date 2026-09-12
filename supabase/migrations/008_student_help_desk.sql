-- ============================================================================
-- COGNIVA MIGRATION 008: STUDENT HELP DESK / CAMPUS QUERY CENTER & NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT UNIQUE NOT NULL,
  student_id UUID,
  student_name TEXT NOT NULL,
  register_number TEXT NOT NULL,
  department TEXT NOT NULL,
  department_id TEXT,
  year TEXT,
  semester TEXT,
  section TEXT NOT NULL,
  section_id TEXT,
  category TEXT NOT NULL,
  category_label TEXT NOT NULL,
  sub_category TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  subject_id TEXT,
  subject_name TEXT,
  priority TEXT CHECK (priority IN ('NORMAL', 'IMPORTANT', 'URGENT')) DEFAULT 'NORMAL',
  status TEXT CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED')) DEFAULT 'OPEN',
  is_class_wide BOOLEAN DEFAULT FALSE,
  affected_section TEXT,
  assigned_faculty_id TEXT,
  assigned_faculty_name TEXT,
  assigned_admin_id TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for section-based, student-based, and status filtering
CREATE INDEX IF NOT EXISTS idx_student_queries_section ON public.student_queries(section);
CREATE INDEX IF NOT EXISTS idx_student_queries_student_id ON public.student_queries(student_id);
CREATE INDEX IF NOT EXISTS idx_student_queries_status ON public.student_queries(status);
CREATE INDEX IF NOT EXISTS idx_student_queries_category ON public.student_queries(category);
CREATE INDEX IF NOT EXISTS idx_student_queries_faculty ON public.student_queries(assigned_faculty_id);

-- 2. STUDENT QUERY MESSAGES (CONVERSATION THREAD)
CREATE TABLE IF NOT EXISTS public.student_query_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID NOT NULL REFERENCES public.student_queries(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT CHECK (sender_role IN ('student', 'faculty', 'admin')) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_messages_query_id ON public.student_query_messages(query_id);

-- 3. PERSISTENT NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id TEXT NOT NULL, -- user_id, profile_id, or role/section key
  recipient_role TEXT CHECK (recipient_role IN ('student', 'faculty', 'admin')),
  query_id UUID REFERENCES public.student_queries(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  student_name TEXT,
  register_number TEXT,
  department TEXT,
  section TEXT,
  category TEXT,
  priority TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.student_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_query_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Student Queries RLS Policies
CREATE POLICY "Students can view own or section class-wide queries" ON public.student_queries
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      student_id = auth.uid()
      OR is_class_wide = true
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE (p.user_id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
        AND p.role IN ('faculty', 'admin')
      )
    )
  );

CREATE POLICY "Students can create queries" ON public.student_queries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Faculty and Admin can update queries" ON public.student_queries
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      student_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE (p.user_id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
        AND p.role IN ('faculty', 'admin')
      )
    )
  );

-- Query Messages RLS Policies
CREATE POLICY "Authenticated users can read query messages" ON public.student_query_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert query messages" ON public.student_query_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Notifications RLS Policies
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (8, '008_student_help_desk.sql')
ON CONFLICT (id) DO NOTHING;
