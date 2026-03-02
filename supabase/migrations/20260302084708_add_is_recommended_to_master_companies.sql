/*
  # Add is_recommended column to master_companies

  1. Changes
    - `master_companies` テーブルに `is_recommended` (boolean, default false) を追加
    - フリープラン企業でも「おすすめ」タブに表示できるようにするフラグ
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'master_companies' AND column_name = 'is_recommended'
  ) THEN
    ALTER TABLE master_companies ADD COLUMN is_recommended boolean DEFAULT false;
  END IF;
END $$;
