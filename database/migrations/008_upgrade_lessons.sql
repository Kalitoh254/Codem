ALTER TABLE lessons
ADD COLUMN module_id TEXT
    REFERENCES course_modules(id)
    ON DELETE SET NULL;

ALTER TABLE lessons
ADD COLUMN lesson_type TEXT NOT NULL DEFAULT 'reading'
    CHECK (
        lesson_type IN (
            'reading',
            'video',
            'code',
            'interactive',
            'exercise',
            'quiz',
            'project'
        )
    );

ALTER TABLE lessons
ADD COLUMN is_required INTEGER NOT NULL DEFAULT 1
    CHECK (is_required IN (0, 1));

ALTER TABLE lessons
ADD COLUMN estimated_minutes INTEGER
    CHECK (
        estimated_minutes IS NULL
        OR estimated_minutes > 0
    );

CREATE INDEX idx_lessons_module_id
    ON lessons(module_id);

CREATE INDEX idx_lessons_module_position
    ON lessons(module_id, position);
