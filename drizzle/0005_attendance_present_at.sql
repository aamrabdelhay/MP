ALTER TABLE attendance_entries ADD COLUMN IF NOT EXISTS present_at timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS attendance_entries_present_at_idx ON attendance_entries(visit_id, present_at) WHERE present_at IS NOT NULL;
