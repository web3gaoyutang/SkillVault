-- SkillVault Database Schema

CREATE TABLE IF NOT EXISTS `users` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username`      VARCHAR(64)     NOT NULL,
    `email`         VARCHAR(255)    NOT NULL,
    `password_hash` VARCHAR(255)    NOT NULL,
    `display_name`  VARCHAR(128)    NOT NULL DEFAULT '',
    `avatar_url`    VARCHAR(512)    NOT NULL DEFAULT '',
    `status`        TINYINT         NOT NULL DEFAULT 1 COMMENT '1=active, 2=disabled',
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `organizations` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`         VARCHAR(64)     NOT NULL COMMENT 'namespace',
    `display_name` VARCHAR(128)    NOT NULL DEFAULT '',
    `description`  TEXT,
    `avatar_url`   VARCHAR(512)    NOT NULL DEFAULT '',
    `created_by`   BIGINT UNSIGNED NOT NULL,
    `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`),
    KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `org_members` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `org_id`     BIGINT UNSIGNED NOT NULL,
    `user_id`    BIGINT UNSIGNED NOT NULL,
    `role`       VARCHAR(32)     NOT NULL DEFAULT 'developer' COMMENT 'owner/admin/developer/viewer',
    `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_org_user` (`org_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `skills` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `org_id`          BIGINT UNSIGNED NOT NULL,
    `name`            VARCHAR(128)    NOT NULL COMMENT 'Skill identifier',
    `display_name`    VARCHAR(256)    NOT NULL DEFAULT '',
    `description`     TEXT,
    `tags`            JSON            COMMENT 'tag list',
    `visibility`      VARCHAR(16)     NOT NULL DEFAULT 'private' COMMENT 'public/private/internal',
    `runtimes`        JSON            COMMENT 'compatible runtimes',
    `latest_version`  VARCHAR(64)     NOT NULL DEFAULT '',
    `download_count`  BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `created_by`      BIGINT UNSIGNED NOT NULL,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_org_name` (`org_id`, `name`),
    KEY `idx_visibility` (`visibility`),
    KEY `idx_created_by` (`created_by`),
    FULLTEXT KEY `ft_search` (`name`, `display_name`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `skill_versions` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `skill_id`        BIGINT UNSIGNED NOT NULL,
    `version`         VARCHAR(64)     NOT NULL COMMENT 'semver',
    `status`          VARCHAR(32)     NOT NULL DEFAULT 'draft' COMMENT 'draft/pending_review/approved/published/rejected',
    `changelog`       TEXT,
    `artifact_path`   VARCHAR(512)    NOT NULL COMMENT 'MinIO object key',
    `artifact_size`   BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `checksum_sha256` VARCHAR(64)     NOT NULL DEFAULT '',
    `manifest`        JSON            COMMENT 'canonical manifest',
    `reviewed_by`     BIGINT UNSIGNED DEFAULT NULL,
    `reviewed_at`     DATETIME        DEFAULT NULL,
    `review_comment`  TEXT,
    `published_at`    DATETIME        DEFAULT NULL,
    `created_by`      BIGINT UNSIGNED NOT NULL,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_skill_version` (`skill_id`, `version`),
    KEY `idx_status` (`status`),
    KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scan_results` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `version_id` BIGINT UNSIGNED NOT NULL,
    `scan_type`  VARCHAR(32)     NOT NULL COMMENT 'structure/security/metadata',
    `status`     VARCHAR(16)     NOT NULL COMMENT 'passed/warning/failed',
    `findings`   JSON            COMMENT 'scan findings detail',
    `scanned_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_version_id` (`version_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `api_tokens` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`      BIGINT UNSIGNED NOT NULL,
    `name`         VARCHAR(128)    NOT NULL,
    `token_hash`   VARCHAR(255)    NOT NULL,
    `token_prefix` VARCHAR(16)     NOT NULL,
    `scopes`       JSON            COMMENT 'permission scopes',
    `last_used_at` DATETIME        DEFAULT NULL,
    `expires_at`   DATETIME        DEFAULT NULL,
    `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token_hash` (`token_hash`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`       BIGINT UNSIGNED NOT NULL,
    `org_id`        BIGINT UNSIGNED DEFAULT NULL,
    `action`        VARCHAR(64)     NOT NULL,
    `resource_type` VARCHAR(32)     NOT NULL COMMENT 'skill/version/org/user',
    `resource_id`   BIGINT UNSIGNED NOT NULL,
    `detail`        JSON            COMMENT 'action detail',
    `ip`            VARCHAR(45)     NOT NULL DEFAULT '',
    `user_agent`    VARCHAR(512)    NOT NULL DEFAULT '',
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_org_id` (`org_id`),
    KEY `idx_action` (`action`),
    KEY `idx_resource` (`resource_type`, `resource_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
