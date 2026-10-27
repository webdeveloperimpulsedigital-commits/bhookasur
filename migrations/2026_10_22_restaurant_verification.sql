-- ==========================================================
-- Migration: Restaurant verification (strict verified mode)
-- Date: 2026-10-22
-- ----------------------------------------------------------
-- Run once on existing databases (the app also applies this
-- automatically at runtime via ensureRestaurantVerificationSchema).
--
-- Existing rows default to is_verified = 0: they are kept for
-- history / admin review and are hidden from users. Restaurants
-- become verified only when a user selects a Swiggy-verified
-- restaurant (identity, operational status, coordinates, FSSAI
-- licence, customer ratings and live menu all confirmed).
-- ==========================================================

ALTER TABLE `restaurants`
  ADD COLUMN `swiggy_id` varchar(32) DEFAULT NULL,
  ADD COLUMN `verification_source` varchar(32) DEFAULT NULL,
  ADD COLUMN `fssai_license` varchar(20) DEFAULT NULL,
  ADD COLUMN `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN `verified_at` timestamp NULL DEFAULT NULL,
  ADD INDEX `idx_restaurants_swiggy` (`swiggy_id`);

-- Explicitly mark every pre-existing row as unverified
UPDATE `restaurants` SET `is_verified` = 0 WHERE `swiggy_id` IS NULL;
