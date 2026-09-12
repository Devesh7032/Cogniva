-- ============================================================================
-- COGNIVA MIGRATION 009: STUDENT INTELLIGENCE NEWS FEED
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  article_url TEXT NOT NULL,
  title TEXT NOT NULL,
  original_description TEXT NOT NULL,
  cogniva_summary TEXT,
  why_it_matters TEXT NOT NULL,
  eligibility_notes TEXT,
  category TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('OFFICIAL', 'REPUTABLE', 'COMMUNITY')) DEFAULT 'OFFICIAL',
  verification_status TEXT CHECK (verification_status IN ('VERIFIED', 'COMMUNITY_DISCUSSION')) DEFAULT 'VERIFIED',
  is_must_know BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  department_relevance TEXT[] DEFAULT ARRAY['CSE', 'ECE', 'AI&DS', 'ME'],
  importance_score INT DEFAULT 50,
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_student_news_category ON public.student_news_items(category);
CREATE INDEX IF NOT EXISTS idx_student_news_published ON public.student_news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_news_must_know ON public.student_news_items(is_must_know);

-- USER NEWS PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.student_news_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT UNIQUE NOT NULL,
  selected_categories TEXT[] DEFAULT ARRAY['ai', 'technology', 'study', 'careers', 'tools_offers'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.student_news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_news_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read published news" ON public.student_news_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert or manage news items" ON public.student_news_items
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE (p.user_id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
        AND p.role = 'admin'
      )
    )
  );

CREATE POLICY "Users can manage own news preferences" ON public.student_news_preferences
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt() ->> 'email'))
    )
  );

-- Record migration execution
INSERT INTO public._migrations (id, name)
VALUES (9, '009_student_news.sql')
ON CONFLICT (id) DO NOTHING;
