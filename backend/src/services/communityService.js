import db from "../database/db.js";
import crypto from "node:crypto";

function findPost(id) {
  return db.prepare(`
    SELECT *
    FROM community_posts
    WHERE id = ?
  `).get(id);
}

export function createPost(authorId, data) {
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO community_posts (
      id,
      author_id,
      title,
      content,
      post_type
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    authorId,
    data.title,
    data.content,
    data.postType || "question"
  );

  return findPost(id);
}

export function getPosts(postType = null) {
  if (postType) {
    return db.prepare(`
      SELECT *
      FROM community_posts
      WHERE post_type = ?
      ORDER BY created_at DESC
    `).all(postType);
  }

  return db.prepare(`
    SELECT *
    FROM community_posts
    ORDER BY created_at DESC
  `).all();
}

export function getPost(id) {
  return findPost(id);
}

export function recordPostView(id) {
  const post = findPost(id);

  if (!post) {
    return null;
  }

  db.prepare(`
    UPDATE community_posts
    SET view_count = view_count + 1
    WHERE id = ?
  `).run(id);

  return findPost(id);
}

export function updatePost(id, data) {
  const post = findPost(id);

  if (!post) {
    const error = new Error("Community post not found.");
    error.status = 404;
    error.code = "POST_NOT_FOUND";
    throw error;
  }

  const title = data.title ?? post.title;
  const content = data.content ?? post.content;
  const postType = data.postType ?? post.post_type;

  db.prepare(`
    UPDATE community_posts
    SET
      title = ?,
      content = ?,
      post_type = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title,
    content,
    postType,
    id
  );

  return findPost(id);
}

export function deletePost(id) {
  const post = findPost(id);

  if (!post) {
    const error = new Error("Community post not found.");
    error.status = 404;
    error.code = "POST_NOT_FOUND";
    throw error;
  }

  db.prepare(`
    DELETE FROM community_posts
    WHERE id = ?
  `).run(id);

  return true;
}

export function updatePostStatus(id, status) {
    const allowedStatuses = ["open", "solved", "closed"];

    if (!allowedStatuses.includes(status)) {
        const error = new Error(
            "Invalid community post status."
        );
        error.status = 400;
        error.code = "INVALID_POST_STATUS";
        throw error;
    }

    const post = findPost(id);

    if (!post) {
        const error = new Error("Community post not found.");
        error.status = 404;
        error.code = "POST_NOT_FOUND";
        throw error;
    }

    db.prepare(`
        UPDATE community_posts
        SET
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        status,
        id
    );

    return findPost(id);
}
