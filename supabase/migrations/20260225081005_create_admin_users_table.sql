/*
  # Create admin_users table

  1. New Tables
    - `admin_users`
      - `user_id` (uuid, primary key, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `admin_users` table
    - Authenticated users can check if their own user_id exists (SELECT)
    - No INSERT/UPDATE/DELETE policies (managed via Supabase dashboard)
*/

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can check own admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
