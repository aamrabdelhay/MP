ALTER TABLE attendance_entries ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;
