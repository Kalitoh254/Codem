import db from "../database/db.js";

export function getDeveloperDashboard(userId) {
    const user = db.prepare(`
        SELECT
            u.id,
            u.username,
            u.role,
            u.status,
            u.email_verified,
            u.created_at,
            p.display_name,
            p.bio,
            p.avatar_url,
            p.location,
            p.website_url,
            p.github_url,
            p.linkedin_url
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.id = ?
    `).get(userId);

    if (!user) {
        throw Object.assign(
            new Error("Developer not found."),
            { status: 404, code: "DEVELOPER_NOT_FOUND" }
        );
    }

    const skills = db.prepare(`
        SELECT
            s.id,
            s.name,
            s.slug,
            us.proficiency AS level
        FROM user_skills us
        JOIN skills s ON s.id = us.skill_id
        WHERE us.user_id = ?
        ORDER BY s.name ASC
    `).all(userId);

    const projects = db.prepare(`
        SELECT
            id,
            name,
            slug,
            description,
            visibility,
            created_at,
            updated_at
        FROM projects
        WHERE owner_id = ?
        ORDER BY updated_at DESC
        LIMIT 20
    `).all(userId);

    const projectCount = db.prepare(`
        SELECT COUNT(*) AS count
        FROM projects
        WHERE owner_id = ?
    `).get(userId).count;

    const publicProjectCount = db.prepare(`
        SELECT COUNT(*) AS count
        FROM projects
        WHERE owner_id = ?
        AND visibility = 'public'
    `).get(userId).count;

    const postCount = db.prepare(`
        SELECT COUNT(*) AS count
        FROM community_posts
        WHERE author_id = ?
    `).get(userId).count;

    const commentCount = db.prepare(`
        SELECT COUNT(*) AS count
        FROM comments
        WHERE author_id = ?
    `).get(userId).count;

    const bookmarks = db.prepare(`
        SELECT COUNT(*) AS count
        FROM bookmarks
        WHERE user_id = ?
    `).get(userId).count;

    const enrollments = db.prepare(`
        SELECT COUNT(*) AS count
        FROM enrollments
        WHERE user_id = ?
    `).get(userId).count;

    const completedLessons = db.prepare(`
        SELECT COUNT(*) AS count
        FROM lesson_progress
        WHERE user_id = ?
        AND status = 'completed'
    `).get(userId).count;

    const submissions = db.prepare(`
        SELECT COUNT(*) AS count
        FROM submissions
        WHERE user_id = ?
    `).get(userId).count;

    const notifications = db.prepare(`
        SELECT COUNT(*) AS count
        FROM notifications
        WHERE user_id = ?
        AND is_read = 0
    `).get(userId).count;

    const profileFields = [
        "display_name",
        "bio",
        "avatar_url",
        "location",
        "website_url",
        "github_url"
    ];

    const completedProfileFields = profileFields.filter(
        field => user[field]
    ).length;

    const profileCompletion = Math.round(
        (completedProfileFields / profileFields.length) * 100
    );

    return {
        developer: user,
        profile: {
            completionPercentage: profileCompletion
        },
        skills,
        projects,
        activity: {
            projectCount,
            publicProjectCount,
            communityPosts: postCount,
            comments: commentCount,
            bookmarks,
            courseEnrollments: enrollments,
            completedLessons,
            submissions,
            unreadNotifications: notifications
        }
    };
}
