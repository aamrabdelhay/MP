CREATE TABLE IF NOT EXISTS attendance_visits (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(180) NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS attendance_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), visit_id uuid NOT NULL REFERENCES attendance_visits(id) ON DELETE CASCADE,
 full_name varchar(180) NOT NULL, status varchar(12) NOT NULL DEFAULT 'unmarked' CHECK (status IN ('unmarked','present','absent')),
 position integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attendance_entries_visit_position_idx ON attendance_entries(visit_id, position, created_at);
