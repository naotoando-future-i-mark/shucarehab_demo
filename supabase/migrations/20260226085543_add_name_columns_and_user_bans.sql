/*
  # Add name columns to user_profiles and create user_bans table

  1. Changes to user_profiles
    - Add `last_name` (text) - 姓
    - Add `first_name` (text) - 名
    - Add `last_kana` (text) - 姓フリガナ
    - Add `first_kana` (text) - 名フリガナ

  2. New Table: user_bans
    - `id` (uuid, primary key)
    - `user_id` (uuid) - 停止対象ユーザー
    - `reason` (text) - 停止理由
    - `banned_at` (timestamptz) - 停止日時
    - `banned_by` (uuid) - 停止した管理者のuser_id
    - `unbanned_at` (timestamptz, nullable) - 解除日時

  3. Security
    - Enable RLS on user_bans
    - Admin-only read/write policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN first_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_kana'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_kana text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'first_kana'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN first_kana text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  banned_at timestamptz NOT NULL DEFAULT now(),
  banned_by uuid,
  unbanned_at timestamptz
);

ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view user bans"
  ON user_bans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert user bans"
  ON user_bans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update user bans"
  ON user_bans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );
