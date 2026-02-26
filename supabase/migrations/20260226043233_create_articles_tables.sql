/*
  # Create articles tables for magazine management

  1. New Tables
    - `tags` - タグマスター
      - `id` (uuid, primary key)
      - `name` (text, unique) タグ名
      - `created_at` (timestamptz)

    - `articles` - 記事
      - `id` (uuid, primary key)
      - `title` (text) タイトル（必須）
      - `description` (text) 説明文
      - `status` (text) ステータス: draft / published / scheduled
      - `published_at` (timestamptz) 公開日時
      - `likes` (integer) いいね数
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `article_images` - 記事画像
      - `id` (uuid, primary key)
      - `article_id` (uuid, FK -> articles)
      - `url` (text) 画像URL
      - `sort_order` (integer) 表示順
      - `created_at` (timestamptz)

    - `article_tags` - 画像上の企業タグ（将来的な拡張用）
      - `id` (uuid, primary key)
      - `name` (text) タグ名
      - `created_at` (timestamptz)

    - `article_tag_links` - 記事とタグの中間テーブル
      - `id` (uuid, primary key)
      - `article_id` (uuid, FK -> articles)
      - `tag_id` (uuid, FK -> tags)
      - UNIQUE(article_id, tag_id)

  2. Security
    - Enable RLS on all tables
    - SELECT: authenticated users can read all data
    - INSERT/UPDATE/DELETE: authenticated users can manage (admin check handled at app level)

  3. Notes
    - tags テーブルは汎用タグ管理
    - article_tags テーブルは画像上に表示する企業タグ用（仕様に含まれるため作成）
    - article_tag_links が articles と tags の多対多を管理
*/

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (true);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view articles"
  ON articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete articles"
  ON articles FOR DELETE
  TO authenticated
  USING (true);

-- Article images table
CREATE TABLE IF NOT EXISTS article_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE article_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view article images"
  ON article_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert article images"
  ON article_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update article images"
  ON article_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete article images"
  ON article_images FOR DELETE
  TO authenticated
  USING (true);

-- Article tags (企業タグ) table
CREATE TABLE IF NOT EXISTS article_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view article_tags"
  ON article_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert article_tags"
  ON article_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update article_tags"
  ON article_tags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete article_tags"
  ON article_tags FOR DELETE
  TO authenticated
  USING (true);

-- Article tag links table (articles <-> tags many-to-many)
CREATE TABLE IF NOT EXISTS article_tag_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(article_id, tag_id)
);

ALTER TABLE article_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view article tag links"
  ON article_tag_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert article tag links"
  ON article_tag_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete article tag links"
  ON article_tag_links FOR DELETE
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles(status);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles(published_at);
CREATE INDEX IF NOT EXISTS article_images_article_id_idx ON article_images(article_id);
CREATE INDEX IF NOT EXISTS article_images_sort_order_idx ON article_images(article_id, sort_order);
CREATE INDEX IF NOT EXISTS article_tag_links_article_id_idx ON article_tag_links(article_id);
CREATE INDEX IF NOT EXISTS article_tag_links_tag_id_idx ON article_tag_links(tag_id);
