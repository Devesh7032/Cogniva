-- ============================================================================
-- COGNIVA SUPABASE AUTHENTICATION & PROFILES SETUP
-- Run this script in your Supabase Project -> SQL Editor
-- Project URL: https://gtoacfhmilqrtjjiyzci.supabase.co
-- ============================================================================

-- 1. Create profiles table if it does not exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Allow individual read access" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to view profiles
CREATE POLICY "Allow authenticated read access" ON public.profiles
  FOR SELECT TO authenticated USING (true);
