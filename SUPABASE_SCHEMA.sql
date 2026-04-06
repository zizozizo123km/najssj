-- ==========================================
-- COMPLETE SUPABASE SETUP SCRIPT (UNIFIED)
-- ==========================================
-- This script creates all tables, enables RLS, and sets up policies.
-- Run this in the Supabase SQL Editor.

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  branch TEXT,
  role TEXT DEFAULT 'student',
  bio TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. POSTS TABLE
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  author_name TEXT,
  author_avatar TEXT,
  content TEXT NOT NULL,
  subject TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. LIKES TABLE
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- 4. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. CHAT GROUPS
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  branch_id TEXT,
  subject_id TEXT,
  member_count INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  last_message JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES chat_groups ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. QUIZ SESSIONS
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  subject TEXT,
  score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. ADMIN SETTINGS
CREATE TABLE IF NOT EXISTS admin_settings (
  id TEXT PRIMARY KEY,
  maintenance_mode BOOLEAN DEFAULT false,
  gemini_api_key TEXT,
  youtube_api_key TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- ENABLE RLS & POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Profiles are public" ON profiles;
CREATE POLICY "Profiles are public" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Posts Policies
DROP POLICY IF EXISTS "Posts are public" ON posts;
CREATE POLICY "Posts are public" ON posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can post" ON posts;
CREATE POLICY "Authenticated users can post" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authors can update/delete own posts" ON posts;
CREATE POLICY "Authors can update/delete own posts" ON posts FOR ALL USING (auth.uid() = author_id);

-- 3. Chat Policies
DROP POLICY IF EXISTS "Auth users can read chat" ON chat_groups;
CREATE POLICY "Auth users can read chat" ON chat_groups FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth users can read messages" ON chat_messages;
CREATE POLICY "Auth users can read messages" ON chat_messages FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth users can send messages" ON chat_messages;
CREATE POLICY "Auth users can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = sender_id);

-- 4. Admin Settings Policies
DROP POLICY IF EXISTS "Admins only can update settings" ON admin_settings;
CREATE POLICY "Admins only can update settings" ON admin_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Everyone can read settings" ON admin_settings;
CREATE POLICY "Everyone can read settings" ON admin_settings FOR SELECT USING (true);

-- 5. Notifications Policies
DROP POLICY IF EXISTS "Users can see own notifications" ON notifications;
CREATE POLICY "Users can see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- SEED DATA & TRIGGERS
-- ==========================================

-- Insert default admin settings
INSERT INTO admin_settings (id, maintenance_mode)
VALUES ('general', false)
ON CONFLICT (id) DO NOTHING;

-- Trigger for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, branch, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'branch',
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set default admin (Replace with your email)
-- UPDATE profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = 'dzs325105@gmail.com');
