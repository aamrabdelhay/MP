ALTER TABLE attendance_entries DROP CONSTRAINT IF EXISTS attendance_entries_status_check;
--> statement-breakpoint
ALTER TABLE attendance_entries ADD CONSTRAINT attendance_entries_status_check CHECK (status IN ('unmarked','present','absent','moving'));
