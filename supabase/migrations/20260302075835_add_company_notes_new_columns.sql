/*
  # Add new columns to company_notes table

  ## Changes
  - Add `founded_year` (text) - 設立年
  - Add `capital` (text) - 資本金
  - Add `revenue` (text) - 売上高
  - Add `business_description` (text) - 事業内容
  - Add `website_url` (text) - 企業HP

  ## Notes
  - All columns are nullable text with empty string default
  - Existing rows are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_notes' AND column_name = 'founded_year'
  ) THEN
    ALTER TABLE company_notes ADD COLUMN founded_year text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_notes' AND column_name = 'capital'
  ) THEN
    ALTER TABLE company_notes ADD COLUMN capital text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_notes' AND column_name = 'revenue'
  ) THEN
    ALTER TABLE company_notes ADD COLUMN revenue text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_notes' AND column_name = 'business_description'
  ) THEN
    ALTER TABLE company_notes ADD COLUMN business_description text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_notes' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE company_notes ADD COLUMN website_url text NOT NULL DEFAULT '';
  END IF;
END $$;
