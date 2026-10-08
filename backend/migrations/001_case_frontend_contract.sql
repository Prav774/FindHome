-- Add frontend-facing case fields while preserving each existing integer id.
ALTER TABLE cases ADD COLUMN IF NOT EXISTS public_case_id VARCHAR(7);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS clothing TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS identifying_marks TEXT;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM cases WHERE public_case_id IS NULL) > 9999 THEN
        RAISE EXCEPTION 'Cannot assign four-digit FH public IDs to more than 9999 existing cases';
    END IF;
END $$;

WITH numbered_cases AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at NULLS FIRST, id) AS public_number
    FROM cases
    WHERE public_case_id IS NULL
)
UPDATE cases AS target
SET public_case_id = 'FH-' || LPAD(numbered_cases.public_number::TEXT, 4, '0')
FROM numbered_cases
WHERE target.id = numbered_cases.id;

ALTER TABLE cases ALTER COLUMN public_case_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ix_cases_public_case_id ON cases (public_case_id);
