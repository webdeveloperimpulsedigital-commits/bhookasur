-- ==========================================================
-- Bakasur Ka Food Tour - MySQL Database Schema (bakasur_food_tour_1)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `bakasur_food_tour_1` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `bakasur_food_tour_1`;

-- 1. Restaurants Table
CREATE TABLE IF NOT EXISTS `restaurants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `address` VARCHAR(500) NOT NULL,
    `area` VARCHAR(150),
    `city` VARCHAR(100) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `rating` DECIMAL(3, 2) DEFAULT 4.50,
    `image` VARCHAR(1000) NOT NULL,
    `is_campaign_active` TINYINT(1) DEFAULT 1,
    `total_visits` INT DEFAULT 0,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_city` (`city`),
    INDEX `idx_rating` (`rating`),
    INDEX `idx_lat_lng` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Dishes Table
CREATE TABLE IF NOT EXISTS `dishes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `restaurant_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `price` DECIMAL(8, 2) DEFAULT 150.00,
    `image` VARCHAR(1000) NOT NULL,
    `rating` DECIMAL(3, 2) DEFAULT 4.70,
    `popularity` INT DEFAULT 95,
    `is_recommended` TINYINT(1) DEFAULT 1,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
    INDEX `idx_restaurant_id` (`restaurant_id`),
    INDEX `idx_dish_popularity` (`popularity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bakasur Videos & Eating Stages Table
CREATE TABLE IF NOT EXISTS `bakasur_videos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `restaurant_id` INT NULL,
    `dish_id` INT NULL,
    `stage` VARCHAR(50) NOT NULL,
    `stage_number` INT DEFAULT 1,
    `video_url` VARCHAR(1000) NOT NULL,
    `thumbnail` VARCHAR(1000),
    `duration` INT DEFAULT 15,
    `meter_percentage` INT NOT NULL DEFAULT 20,
    `message` TEXT NOT NULL,
    `cta_text` VARCHAR(100) DEFAULT '🍽️ AUR KHILAO',
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_rest_dish_stage` (`restaurant_id`, `dish_id`, `stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Campaign Sessions Table
CREATE TABLE IF NOT EXISTS `campaign_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(100) NOT NULL UNIQUE,
    `user_location` VARCHAR(255),
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `restaurant_id` INT,
    `dish_id` INT,
    `current_stage` VARCHAR(50) DEFAULT 'welcome',
    `current_step` VARCHAR(50) DEFAULT 'frame_1',
    `food_meter_percentage` INT DEFAULT 20,
    `aur_khilo_clicks` INT DEFAULT 0,
    `video_completed` TINYINT(1) DEFAULT 0,
    `map_visited` TINYINT(1) DEFAULT 0,
    `form_submitted` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Campaign Global Visits Table (Shared Food Tour Map)
CREATE TABLE IF NOT EXISTS `campaign_visits` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(100) NOT NULL,
    `restaurant_id` INT NOT NULL,
    `dish_id` INT,
    `city` VARCHAR(100),
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `visited_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
    INDEX `idx_visit_restaurant` (`restaurant_id`),
    INDEX `idx_visited_at` (`visited_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Participants & Contest Entries Table
CREATE TABLE IF NOT EXISTS `participants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(100) NOT NULL,
    `participation_id` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `restaurant_name` VARCHAR(255),
    `dish_name` VARCHAR(255),
    `consent` TINYINT(1) DEFAULT 1,
    `terms_accepted` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_participation_id` (`participation_id`),
    INDEX `idx_city` (`city`),
    INDEX `idx_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. User Journey Steps Table (Detailed Chronological Step-by-Step History)
CREATE TABLE IF NOT EXISTS `user_journey_steps` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(100) NOT NULL,
    `step_number` INT NOT NULL DEFAULT 1,
    `step_name` VARCHAR(50) NOT NULL,
    `step_title` VARCHAR(150),
    `metadata` JSON,
    `user_location` VARCHAR(255),
    `ip_address` VARCHAR(100),
    `user_agent` VARCHAR(500),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_journey_session` (`session_id`),
    INDEX `idx_journey_step` (`step_name`),
    INDEX `idx_journey_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
