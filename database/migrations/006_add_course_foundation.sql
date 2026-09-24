ALTER TABLE courses
ADD COLUMN duration_minutes INTEGER
    CHECK (
        duration_minutes IS NULL
        OR duration_minutes > 0
    );

ALTER TABLE courses
ADD COLUMN category TEXT;

ALTER TABLE courses
ADD COLUMN prerequisites TEXT;

ALTER TABLE courses
ADD COLUMN learning_outcomes TEXT;
