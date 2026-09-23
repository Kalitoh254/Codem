ALTER TABLE comments
ADD COLUMN parent_comment_id TEXT;

CREATE INDEX idx_comments_parent_comment_id
ON comments(parent_comment_id);
