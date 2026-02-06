/*
  # Create all tables for Shukarehub application

  1. Tables
    - events: カレンダーイベント
    - color_presets: カラープリセット
    - companies: ユーザーが管理する企業
    - company_notes: 企業の詳細情報
    - company_memos: 企業メモ
    - selection_events: 選考イベント
    - selection_progress: 選考進捗
    - reference_sites: 参考サイト
    - saved_articles: 保存した記事
    - master_companies: 企業マスターデータ
    - memos: メモ

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  color_id text NOT NULL,
  event_type text,
  company_name text,
  deadline_at timestamptz,
  meeting_url text,
  location text,
  preparation_dates jsonb,
  recurrence_type text DEFAULT 'none',
  recurrence_interval integer,
  recurrence_days integer[],
  recurrence_monthly_type text,
  recurrence_monthly_day integer,
  recurrence_monthly_weekday integer,
  recurrence_end_type text DEFAULT 'never',
  recurrence_end_count integer,
  recurrence_end_date timestamptz,
  memo text,
  notifications jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Color presets table
CREATE TABLE IF NOT EXISTS color_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  color text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE color_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own color presets"
  ON color_presets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own color presets"
  ON color_presets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own color presets"
  ON color_presets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own color presets"
  ON color_presets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#FFA52F',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Company notes table
CREATE TABLE IF NOT EXISTS company_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  industry text DEFAULT '',
  job_type text DEFAULT '',
  location text DEFAULT '',
  employee_count text DEFAULT '',
  listing_status text DEFAULT '',
  base_salary text DEFAULT '',
  web_test text DEFAULT '',
  working_hours text DEFAULT '',
  mypage_url text DEFAULT '',
  login_id text DEFAULT '',
  password text DEFAULT '',
  login_notes text DEFAULT '',
  custom_fields jsonb DEFAULT '[]'::jsonb,
  free_memo text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company notes"
  ON company_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own company notes"
  ON company_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company notes"
  ON company_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company notes"
  ON company_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Company memos table
CREATE TABLE IF NOT EXISTS company_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_note_id uuid NOT NULL REFERENCES company_notes(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  category text DEFAULT 'other',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memos of own companies"
  ON company_memos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = company_memos.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create memos for own companies"
  ON company_memos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = company_memos.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update memos of own companies"
  ON company_memos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = company_memos.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = company_memos.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete memos of own companies"
  ON company_memos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = company_memos.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

-- Selection events table
CREATE TABLE IF NOT EXISTS selection_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_note_id uuid NOT NULL REFERENCES company_notes(id) ON DELETE CASCADE,
  title text NOT NULL,
  date timestamptz NOT NULL,
  start_time text,
  end_time text,
  location text DEFAULT '',
  meeting_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE selection_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view selection events of own companies"
  ON selection_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = selection_events.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create selection events for own companies"
  ON selection_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = selection_events.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update selection events of own companies"
  ON selection_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = selection_events.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = selection_events.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete selection events of own companies"
  ON selection_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = selection_events.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

-- Selection progress table
CREATE TABLE IF NOT EXISTS selection_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_note_id uuid NOT NULL REFERENCES company_notes(id) ON DELETE CASCADE,
  stage text NOT NULL,
  status text DEFAULT 'pending',
  date timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE selection_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view selection progress of own companies"
  ON selection_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = selection_progress.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create selection progress for own companies"
  ON selection_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = selection_progress.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update selection progress of own companies"
  ON selection_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = selection_progress.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = selection_progress.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete selection progress of own companies"
  ON selection_progress FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_notes
      WHERE company_notes.id = selection_progress.company_note_id
      AND company_notes.user_id = auth.uid()
    )
  );

-- Reference sites table
CREATE TABLE IF NOT EXISTS reference_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reference_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reference sites"
  ON reference_sites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reference sites"
  ON reference_sites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reference sites"
  ON reference_sites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reference sites"
  ON reference_sites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Saved articles table
CREATE TABLE IF NOT EXISTS saved_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, article_id)
);

ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved articles"
  ON saved_articles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save articles"
  ON saved_articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved articles"
  ON saved_articles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Master companies table (public data)
CREATE TABLE IF NOT EXISTS master_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tag text DEFAULT 'インターン',
  deadline text DEFAULT '',
  deadline_closed boolean DEFAULT false,
  industry text DEFAULT '',
  location text DEFAULT '',
  employees text DEFAULT '',
  is_premium boolean DEFAULT false,
  premium_image text,
  is_urgent boolean DEFAULT false,
  event_title text,
  event_period text,
  event_area text,
  event_duration text,
  position text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE master_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view master companies"
  ON master_companies FOR SELECT
  TO authenticated
  USING (true);

-- Memos table
CREATE TABLE IF NOT EXISTS memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  color text DEFAULT '#FFA52F',
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memos"
  ON memos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own memos"
  ON memos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memos"
  ON memos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memos"
  ON memos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);
CREATE INDEX IF NOT EXISTS events_start_at_idx ON events(start_at);
CREATE INDEX IF NOT EXISTS color_presets_user_id_idx ON color_presets(user_id);
CREATE INDEX IF NOT EXISTS companies_user_id_idx ON companies(user_id);
CREATE INDEX IF NOT EXISTS company_notes_user_id_idx ON company_notes(user_id);
CREATE INDEX IF NOT EXISTS company_notes_company_id_idx ON company_notes(company_id);
CREATE INDEX IF NOT EXISTS company_memos_company_note_id_idx ON company_memos(company_note_id);
CREATE INDEX IF NOT EXISTS selection_events_company_note_id_idx ON selection_events(company_note_id);
CREATE INDEX IF NOT EXISTS selection_progress_company_note_id_idx ON selection_progress(company_note_id);
CREATE INDEX IF NOT EXISTS reference_sites_user_id_idx ON reference_sites(user_id);
CREATE INDEX IF NOT EXISTS reference_sites_company_id_idx ON reference_sites(company_id);
CREATE INDEX IF NOT EXISTS saved_articles_user_id_idx ON saved_articles(user_id);
CREATE INDEX IF NOT EXISTS memos_user_id_idx ON memos(user_id);
