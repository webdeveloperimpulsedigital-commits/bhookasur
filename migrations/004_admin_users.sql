-- --------------------------------------------------------
-- Table structure for table `admin_users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admin_users` (`email`, `password_hash`, `role`, `is_active`) VALUES
('shweta.k@theimpulsedigital.com', 'sha256$8f4b2e9a1c7d6e3f5a0b4c8d$edb8bc38b33a3ac21b980daeec4d5c21c2e08c3e359e524c2297b73f93401c11', 'super_admin', 1),
('admin@bhookasurkafoodtour.com', 'sha256$3c9e1a7f5b2d8e4c6a1f9b3e$e1972a20056e676f34c663eb28aaf41df91ef5523786222be4215d2a5407fb9b', 'admin', 1)
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `role` = VALUES(`role`),
  `is_active` = 1;
