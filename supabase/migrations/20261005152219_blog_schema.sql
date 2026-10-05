/*
# Blog Platform Schema

## Overview
Creates the core tables for a multi-user blogging platform: user profiles,
blog posts, and comments. All tables use Row Level Security with ownership-based
policies so users can only modify their own content while reading is public.

## New Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per user, keyed to their auth identity
- `username` (text, unique, not null) — display name shown on posts and comments
- `bio` (text) — optional short biography
- `avatar_url` (text) — optional avatar image URL
- `created_at` (timestamptz) — when the profile was created

### posts
- `id` (uuid, PK) — unique post identifier
- `title` (text, not null) — post title
- `content` (text, not null) — post body (markdown / plain text)
- `excerpt` (text) — optional short summary for the feed
- `cover_image_url` (text) — optional cover image URL
- `published` (boolean, default false) — draft vs published
- `user_id` (uuid, not null, default auth.uid()) — author, references profiles
- `created_at` (timestamptz) — creation time
- `updated_at` (timestamptz) — last edit time

### comments
- `id` (uuid, PK) — unique comment identifier
- `post_id` (uuid, not null, references posts) — the post being commented on
- `content` (text, not null) — comment body
- `user_id` (uuid, not null, default auth.uid()) — commenter, references profiles
- `created_at` (timestamptz) — when the comment was posted

## Indexes
- `posts_user_id_idx` — fast lookups of a user's posts
- `posts_published_created_at_idx` — fast feed queries (published, newest first)
- `comments_post_id_idx` — fast retrieval of a post's comments

## Security (RLS)
- profiles: anyone can read; users can only update their own row
- posts: anyone can read published posts; authenticated users can read their own drafts;
  only the author can insert / update / delete their own posts
- comments: anyone can read comments on published posts; authenticated users can
  insert their own comments; only the commenter can delete their own comment
*/

-- ── profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── posts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_image_url text,
  published boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts; authors can also read their own drafts
DROP POLICY IF EXISTS "posts_select" ON posts;
CREATE POLICY "posts_select"
  ON posts FOR SELECT
  TO anon, authenticated
  USING (published = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── comments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments on published posts
DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
        AND (posts.published = true OR posts.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_published_created_at_idx ON posts(published, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
