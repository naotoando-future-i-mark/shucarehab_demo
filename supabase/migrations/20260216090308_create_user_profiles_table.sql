/*
  # Create user_profiles table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - プロフィールID
      - `user_id` (uuid, foreign key) - ユーザーID（auth.usersへの参照）
      - `university` (text) - 大学名
      - `faculty` (text) - 学部
      - `department` (text) - 学科
      - `graduation_year` (integer) - 卒業年度
      - `preferred_locations` (text[]) - 希望勤務地（配列）
      - `interested_industries` (text[]) - 興味のある業界（配列）
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for authenticated users to read their own profile
    - Add policy for authenticated users to insert their own profile
    - Add policy for authenticated users to update their own profile
    - Add policy for authenticated users to delete their own profile

  3. Indexes
    - Add unique index on user_id to ensure one profile per user
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university text DEFAULT '',
  faculty text DEFAULT '',
  department text DEFAULT '',
  graduation_year integer,
  preferred_locations text[] DEFAULT '{}',
  interested_industries text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure one profile per user
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
