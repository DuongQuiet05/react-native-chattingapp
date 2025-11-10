CREATE TABLE IF NOT EXISTS stories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    music_url VARCHAR(500),
    music_title VARCHAR(255),
    text_overlay TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    view_count BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE IF NOT EXISTS story_views (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    story_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_story_user (story_id, user_id),
    INDEX idx_story_user (story_id, user_id),
    INDEX idx_story_id (story_id)
);

