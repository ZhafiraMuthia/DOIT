CREATE DATABASE IF NOT EXISTS `doit_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `doit_db`;

SET NAMES utf8mb4;

CREATE TABLE `categories` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tasks` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` INT UNSIGNED DEFAULT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `status` ENUM('to_do', 'in_progress', 'completed') NOT NULL DEFAULT 'to_do',
    `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    `due_date` DATE DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_tasks_category` (`category_id`),
    KEY `idx_tasks_status` (`status`),
    KEY `idx_tasks_priority` (`priority`),
    CONSTRAINT `fk_tasks_categories` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO `categories` (`name`) VALUES
    ('Personal'),
    ('Academic'),
    ('Organization');

INSERT INTO `tasks` (`category_id`, `title`, `description`, `status`, `priority`, `due_date`) VALUES
    (1, 'Belanja', 'Belanja bulanan (sampo, sabun, odol, tisu)', 'to_do', 'medium', '2026-11-24'),
    (1, 'Beberes kosan', 'Nyapu, ngepel, nyikat kamar mandi', 'in_progress', 'low', '2026-11-25'),
    (2, 'Tugas basis data', 'Buat PPT tentang ERD', 'in_progress', 'high', '2026-11-24'),
    (2, 'UTS KWU', 'Baca PPT 1-4 dari Bapak', 'to_do', 'high', '2026-11-28'),
    (2, 'Zoom RPL', 'Bahas project dan pembagian tugas', 'to_do', 'medium', '2026-11-26'),
    (3, 'Soal Eduquest', 'Buat 5 soal Eduquest tentang alpro + basdat', 'completed', 'medium', '2026-11-20');
