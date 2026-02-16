/*
  # Fix selection_progress and selection_events tables

  ## Changes Made
  
  ### selection_progress table
  1. Add `track_type` column (text, for 'intern' or 'fulltime')
  2. Rename `date` column to `passed_date` (date type)
  3. Remove `status` column (not used in code)
  
  ### selection_events table
  1. Add `track_type` column (text, for 'intern' or 'fulltime')
  2. Add `event_type` column (text)
  3. Add `date_type` column (text, for 'deadline' or 'schedule')
  4. Add `deadline_date` column (text)
  5. Add `deadline_time` column (text, nullable)
  6. Rename `date` to `start_date` (text)
  7. Add `end_date` column (text)
  8. Add `status` column (text, default 'pending')
  9. Rename `notes` to `memo` (text)
  10. Add `calendar_event_id` column (uuid, nullable)
  
  ## Security
  - RLS policies remain unchanged as they reference table IDs

  ## Notes
  - Using text for dates to match frontend expectations
  - Default values provided for new required columns
*/

-- selection_progress table modifications
DO $$
BEGIN
  -- Add track_type column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_progress' AND column_name = 'track_type'
  ) THEN
    ALTER TABLE selection_progress ADD COLUMN track_type text DEFAULT 'intern';
  END IF;

  -- Add passed_date column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_progress' AND column_name = 'passed_date'
  ) THEN
    ALTER TABLE selection_progress ADD COLUMN passed_date text;
    -- Copy data from date column if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'selection_progress' AND column_name = 'date'
    ) THEN
      UPDATE selection_progress SET passed_date = date::text WHERE date IS NOT NULL;
    END IF;
  END IF;

  -- Remove status column if exists (not used in code)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_progress' AND column_name = 'status'
  ) THEN
    ALTER TABLE selection_progress DROP COLUMN status;
  END IF;

  -- Remove old date column if exists and passed_date exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_progress' AND column_name = 'date'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_progress' AND column_name = 'passed_date'
  ) THEN
    ALTER TABLE selection_progress DROP COLUMN date;
  END IF;
END $$;

-- selection_events table modifications
DO $$
BEGIN
  -- Add track_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'track_type'
  ) THEN
    ALTER TABLE selection_events ADD COLUMN track_type text DEFAULT 'intern';
  END IF;

  -- Add event_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE selection_events ADD COLUMN event_type text DEFAULT '';
  END IF;

  -- Add date_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'date_type'
  ) THEN
    ALTER TABLE selection_events ADD COLUMN date_type text DEFAULT 'schedule';
  END IF;

  -- Add deadline_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'deadline_date'
  ) THEN
    ALTER TABLE selection_events ADD COLUMN deadline_date text;
  END IF;

  -- Add deadline_time column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'deadline_time'
  ) THEN
    ALTER TABLE selection_events ADD COLUMN deadline_time text;
  END IF;

  -- Add start_date column and migrate data from date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE selection_events ADD COLUMN start_date text;
    -- Copy data from date column if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'selection_events' AND column_name = 'date'
    ) THEN
      UPDATE selection_events SET start_date = date::text WHERE date IS NOT NULL;
    END IF;
  END IF;

  -- Add end_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE selection_events ADD COLUMN end_date text;
  END IF;

  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'status'
  ) THEN
    ALTER TABLE selection_events ADD COLUMN status text DEFAULT 'pending';
  END IF;

  -- Add memo column and migrate data from notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'memo'
  ) THEN
    ALTER TABLE selection_events ADD COLUMN memo text DEFAULT '';
    -- Copy data from notes column if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'selection_events' AND column_name = 'notes'
    ) THEN
      UPDATE selection_events SET memo = notes WHERE notes IS NOT NULL;
    END IF;
  END IF;

  -- Add calendar_event_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'calendar_event_id'
  ) THEN
    ALTER TABLE selection_events ADD COLUMN calendar_event_id uuid;
  END IF;

  -- Remove old date column if exists and start_date exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'date'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE selection_events DROP COLUMN date;
  END IF;

  -- Remove old notes column if exists and memo exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'notes'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'memo'
  ) THEN
    ALTER TABLE selection_events DROP COLUMN notes;
  END IF;

  -- Remove unused columns from selection_events
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'location'
  ) THEN
    ALTER TABLE selection_events DROP COLUMN location;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selection_events' AND column_name = 'meeting_url'
  ) THEN
    ALTER TABLE selection_events DROP COLUMN meeting_url;
  END IF;
END $$;