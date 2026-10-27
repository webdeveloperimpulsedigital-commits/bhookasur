-- ==========================================================
-- Bakasur Ka Food Tour - Complete Production MySQL Database Dump
-- Contains Table Schemas AND Initial Production / Seed Data
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for table `locations`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `locations`;
CREATE TABLE `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'City Name (e.g. Pune, Lucknow)',
  `slug` varchar(100) NOT NULL COMMENT 'URL slug (e.g. pune, lucknow)',
  `region` varchar(100) NOT NULL COMMENT 'State / Region (e.g. Maharashtra, Uttar Pradesh)',
  `icon` varchar(20) DEFAULT '?' COMMENT 'Emoji or icon representation',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_locations_active` (`is_active`,`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=137 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `locations` (3 rows)
INSERT INTO `locations` VALUES
(1, 'Pune', 'pune', 'Pune', '?', 1, 99, '2026-10-09 06:09:07', '2026-10-09 06:09:07'),
(3, 'Anandnagar', 'anandnagar', 'Anandnagar', '?', 1, 99, '2026-10-09 06:53:46', '2026-10-09 06:53:46'),
(10, 'Dhayari', 'dhayari', 'Dhayari', '?', 1, 99, '2026-10-09 08:40:01', '2026-10-09 08:40:01');

-- --------------------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `name` varchar(150) NOT NULL,
  `hindi_name` varchar(150) DEFAULT NULL,
  `icon` varchar(30) DEFAULT '?️',
  `signature_image` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_cat_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `restaurants`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `restaurants`;
CREATE TABLE `restaurants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) DEFAULT 1,
  `name` varchar(150) NOT NULL COMMENT 'Restaurant name (e.g. Vaishali, Tunday Kababi)',
  `slug` varchar(150) NOT NULL,
  `tagline` varchar(255) DEFAULT NULL COMMENT 'Short description / landmark (e.g. FC Road (South Indian Legend))',
  `address` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `city` varchar(100) DEFAULT NULL,
  `area` varchar(150) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT 18.52040000,
  `longitude` decimal(11,8) DEFAULT 73.84070000,
  `rating` decimal(3,2) DEFAULT 4.70,
  `image` varchar(1000) DEFAULT NULL,
  `is_campaign_active` tinyint(1) DEFAULT 1,
  `total_visits` int(11) DEFAULT 100,
  `status` enum('active','inactive') DEFAULT 'active',
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_restaurants_location` (`location_id`,`is_active`,`display_order`),
  KEY `idx_restaurants_slug` (`slug`),
  CONSTRAINT `restaurants_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `restaurants` (66 rows)
INSERT INTO `restaurants` VALUES
(1, 1, 'Chul Angan Restaurant', 'chul-angan-restaurant', NULL, 'Pune, India', 1, 0, '2026-10-09 06:09:08', '2026-10-12 14:14:52', 'Pune', 'Pune', '18.45724890', '73.80172280', '4.80', NULL, 1, 4, 'active', NULL),
(2, 1, 'Durga Restaurant and Bar', 'durga-restaurant-and-bar', NULL, 'Pune, India', 1, 0, '2026-10-09 06:15:29', '2026-10-09 06:15:29', 'Pune', 'Pune', '18.49972900', '73.85031100', '4.80', NULL, 1, 1, 'active', NULL),
(3, 3, 'Atulya Pure Veg', 'atulya-pure-veg', NULL, 'Anandnagar, India', 1, 0, '2026-10-09 06:53:47', '2026-10-12 15:27:22', 'Anandnagar', 'Anandnagar', '18.45547210', '73.79846170', '4.80', NULL, 1, 9, 'active', NULL),
(4, 1, 'Cafe Durga', 'cafe-durga', NULL, 'Pune, India', 1, 0, '2026-10-09 08:15:40', '2026-10-09 08:17:20', 'Pune', 'Pune', '18.45420100', '73.78973400', '4.80', NULL, 1, 3, 'active', NULL),
(5, 1, 'Agatya', 'agatya', NULL, 'Pune, India', 1, 0, '2026-10-09 08:38:30', '2026-10-09 08:38:30', 'Pune', 'Pune', '18.51442500', '73.85428990', '4.80', NULL, 1, 1, 'active', NULL),
(6, 1, 'Durga Cafe & Janhvis Corner', 'durga-cafe-&-janhvis-corner', NULL, 'Pune, India', 1, 0, '2026-10-09 08:39:06', '2026-10-13 15:34:10', 'Pune', 'Pune', '18.52390070', '73.84381360', '4.80', NULL, 1, 5, 'active', NULL),
(7, 10, 'Shree Radha Krishna Pure Veg', 'shree-radha-krishna-pure-veg', NULL, 'Dhayari, India', 1, 0, '2026-10-09 08:40:02', '2026-10-13 09:50:52', 'Dhayari', 'Dhayari', '18.45229310', '73.79333620', '4.80', NULL, 1, 16, 'active', NULL),
(8, 1, 'Hotel Vaishali', 'hotel-vaishali', NULL, 'Pune, India', 1, 0, '2026-10-09 08:43:41', '2026-10-09 08:44:06', 'Pune', 'Pune', '18.45464575', '73.78982216', '4.80', NULL, 1, 2, 'active', NULL),
(9, 1, 'Muktai Garden', 'muktai-garden', NULL, 'Pune, India', 1, 0, '2026-10-09 08:45:27', '2026-10-12 15:27:52', 'Pune', 'Pune', '18.44464000', '73.78570940', '4.80', NULL, 1, 6, 'active', NULL),
(10, 1, 'Meghana Foods', 'meghana-foods-bangalore', NULL, NULL, 1, 0, '2026-10-12 06:05:17', '2026-10-12 06:05:17', 'Bengaluru', 'Residency Road', '12.97190000', '77.60700000', '4.80', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700', 1, 100, 'active', 'Legendary Andhra Spicy Dum Biryani, Chicken 65, Paneer Biryani'),
(11, 1, 'Vidyarthi Bhavan', 'vidyarthi-bhavan-bangalore', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Bengaluru', 'Gandhi Bazaar', '12.94630000', '77.57030000', '4.90', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=700', 1, 100, 'active', 'Iconic Crispy Masala Dosa, Filter Kaapi, Idli Vada since 1943'),
(12, 1, 'MTR (Mavalli Tiffin Room)', 'mtr-bangalore', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Bengaluru', 'Lalbagh', '12.95540000', '77.58780000', '4.80', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700', 1, 100, 'active', 'Authentic South Indian Tiffin, Rava Idli, Filter Coffee, Royal Thali'),
(13, 1, 'Truffles Cafe', 'truffles-bangalore', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Bengaluru', 'Koramangala', '12.93440000', '77.61900000', '4.80', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700', 1, 100, 'active', 'Famous Loaded Burgers, French Fries, Thick Shakes, Pastas'),
(14, 1, 'Paradise Biryani', 'paradise-biryani-hyderabad', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Hyderabad', 'Secunderabad', '17.44280000', '78.48710000', '4.80', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700', 1, 100, 'active', 'World Famous Hyderabadi Dum Biryani, Kebabs, Mughlai Cuisine'),
(15, 1, 'Bawarchi Restaurant', 'bawarchi-hyderabad', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Hyderabad', 'RTC X Roads', '17.40480000', '78.49750000', '4.90', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700', 1, 100, 'active', 'Original Hyderabad Mutton Biryani, Chicken Tikka, Tandoori Platters'),
(16, 1, 'Chutneys', 'chutneys-hyderabad', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Hyderabad', 'Banjara Hills', '17.41560000', '78.43570000', '4.70', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700', 1, 100, 'active', 'Guntur Idli, 7 Varieties of Chutneys, Steam Dosa, Filter Kaapi'),
(17, 1, 'Sardar Refreshments', 'sardar-pav-bhaji-mumbai', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Mumbai', 'Tardeo', '18.96960000', '72.81930000', '4.80', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700', 1, 100, 'active', 'Legendary Extra Butter Pav Bhaji, Cheese Pav Bhaji, Fresh Juices'),
(18, 1, 'Ashok Vada Pav', 'ashok-vada-pav-mumbai', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Mumbai', 'Dadar', '19.01780000', '72.83020000', '4.90', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700', 1, 100, 'active', 'Mumbai Famous Crispy Chura Vada Pav, Spicy Garlic Thecha'),
(19, 1, 'Bademiya', 'bademiya-mumbai', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Mumbai', 'Colaba', '18.92480000', '72.83360000', '4.70', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700', 1, 100, 'active', 'Late Night Iconic Seekh Kebabs, Tandoori Chicken, Mughlai Rolls'),
(20, 1, 'Karims Jama Masjid', 'karims-delhi', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Delhi NCR', 'Old Delhi', '28.65070000', '77.23340000', '4.90', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700', 1, 100, 'active', 'Historic Royal Mughlai, Butter Chicken, Mutton Korma, Tandoori Roti'),
(21, 1, 'Haldirams Chandni Chowk', 'haldirams-delhi', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Delhi NCR', 'Connaught Place', '28.63280000', '77.21970000', '4.80', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=700', 1, 100, 'active', 'Delhi Chole Bhature, Raj Kachori, Pav Bhaji, Royal Sweets & Chaat'),
(22, 1, 'Saravana Bhavan Janpath', 'saravana-bhavan-delhi', NULL, NULL, 1, 0, '2026-10-12 06:05:18', '2026-10-12 06:05:18', 'Delhi NCR', 'Connaught Place', '28.62890000', '77.21850000', '4.70', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=700', 1, 100, 'active', 'Authentic South Indian Ghee Roast Dosa, Filter Kaapi, Mini Tiffin'),
(23, 1, 'The burger byte cafe', 'the-burger-byte-cafe', NULL, 'pune, India', 1, 0, '2026-10-12 09:11:35', '2026-10-12 09:11:35', 'pune', 'pune', '18.52110000', '73.85020000', '4.80', NULL, 1, 1, 'active', NULL),
(24, 1, 'Sukanta', 'sukanta', NULL, 'Pune, India', 1, 0, '2026-10-12 09:12:42', '2026-10-13 06:53:16', 'Pune', 'Pune', '18.51694810', '73.84425700', '4.80', NULL, 1, 3, 'active', NULL),
(25, 1, 'Sukanta Dining Hall', 'sukanta-dining-hall', NULL, 'Pune, India', 1, 0, '2026-10-12 09:33:33', '2026-10-13 07:25:42', 'Pune', 'Pune', '18.45420100', '73.78973400', '4.80', NULL, 1, 3, 'active', NULL),
(26, 1, 'Hotel Shree Jay Ganesh', 'hotel-shree-jay-ganesh', NULL, 'Pune, India', 1, 0, '2026-10-12 09:47:19', '2026-10-12 13:26:08', 'Pune', 'Pune', '18.44478020', '73.78671000', '4.80', NULL, 1, 4, 'active', NULL),
(27, 1, 'Pizza Hut', 'pizza-hut', NULL, 'Pune, India', 1, 0, '2026-10-12 10:19:49', '2026-10-12 10:19:49', 'Pune', 'Pune', '18.52208820', '73.84115750', '4.80', NULL, 1, 1, 'active', NULL),
(28, 1, 'Surabhi', 'surabhi', NULL, 'Pune, India', 1, 0, '2026-10-12 10:29:20', '2026-10-12 10:45:39', 'Pune', 'Pune', '18.52542880', '73.84966050', '4.80', NULL, 1, 4, 'active', NULL),
(29, 1, 'Mathura', 'mathura', NULL, 'Pune, India', 1, 0, '2026-10-12 10:48:18', '2026-10-13 10:42:39', 'Pune', 'Pune', '18.51892790', '73.84465930', '4.80', NULL, 1, 7, 'active', NULL),
(30, 1, 'Rajwadi Gaurav', 'rajwadi-gaurav', NULL, 'Pune, India', 1, 0, '2026-10-12 11:06:30', '2026-10-12 11:06:30', 'Pune', 'Pune', '18.52347680', '73.84367390', '4.80', NULL, 1, 1, 'active', NULL),
(31, 1, 'sudhirbhaucha katta', 'sudhirbhaucha-katta', NULL, 'Pune, India', 1, 0, '2026-10-12 11:08:24', '2026-10-12 11:09:06', 'Pune', 'Pune', '18.51013120', '73.85155570', '4.80', NULL, 1, 2, 'active', NULL),
(32, 1, 'Joshi wadewale', 'joshi-wadewale', NULL, 'Pune, India', 1, 0, '2026-10-12 12:07:10', '2026-10-12 12:44:20', 'Pune', 'Pune', '18.52250790', '73.84954200', '4.80', NULL, 1, 2, 'active', NULL),
(33, 1, 'Ganesh Bhel', 'ganesh-bhel', NULL, 'pune, India', 1, 0, '2026-10-12 12:09:18', '2026-10-12 12:19:27', 'pune', 'pune', '18.52110000', '73.85020000', '4.80', NULL, 1, 4, 'active', NULL),
(34, 1, 'Pav Bhaji', 'pav-bhaji', NULL, 'Pune, India', 1, 0, '2026-10-12 12:21:45', '2026-10-12 12:21:45', 'Pune', 'Pune', '18.52110000', '73.85020000', '4.80', NULL, 1, 1, 'active', NULL),
(35, 1, 'Naivaidya', 'naivaidya', NULL, 'Pune, India', 1, 0, '2026-10-12 12:23:58', '2026-10-12 12:23:58', 'Pune', 'Pune', '18.52334940', '73.84720440', '4.80', NULL, 1, 1, 'active', NULL),
(36, 1, 'Vaishali Restaurant, FC Road', 'vaishali-restaurant,-fc-road', NULL, 'Pune, India', 1, 0, '2026-10-12 14:07:18', '2026-10-12 14:07:18', 'Pune', 'Pune', '18.52040000', '73.84070000', '4.80', NULL, 1, 1, 'active', NULL),
(37, 1, 'Kayani Bakery, Camp', 'kayani-bakery,-camp', NULL, 'Pune, India', 1, 0, '2026-10-12 14:07:18', '2026-10-12 14:07:18', 'Pune', 'Pune', '18.51460000', '73.87890000', '4.80', NULL, 1, 1, 'active', NULL),
(38, 1, 'Vaishali Restaurant, FC Road & Kayani Bakery, Camp', 'vaishali-restaurant,-fc-road-&-kayani-bakery,-camp', NULL, 'Pune, India', 1, 0, '2026-10-12 14:07:19', '2026-10-12 14:07:19', 'Pune', 'Pune', '18.52040000', '73.84070000', '4.80', NULL, 1, 1, 'active', NULL),
(39, 1, 'Kulkarni\'s Kitchen', 'kulkarni\'s-kitchen', NULL, 'Pune, India', 1, 0, '2026-10-12 14:13:32', '2026-10-12 14:54:50', 'Pune', 'Pune', '18.44295160', '73.78598590', '4.80', NULL, 1, 4, 'active', NULL),
(40, 3, 'Kulkarni\'s Kitchen & Chul Angan Restaurant', 'kulkarni\'s-kitchen-&-chul-angan-restaurant', NULL, 'Anandnagar, India', 1, 0, '2026-10-12 14:15:34', '2026-10-12 14:15:34', 'Anandnagar', 'Anandnagar', '18.44295160', '73.78598590', '4.80', NULL, 1, 1, 'active', NULL),
(41, 10, 'Radha Krushna', 'radha-krushna', NULL, 'Dhayari, India', 1, 0, '2026-10-12 14:27:47', '2026-10-12 14:27:47', 'Dhayari', 'Dhayari', '18.45889580', '73.78680260', '4.80', NULL, 1, 1, 'active', NULL),
(42, 1, 'Atulya Pure Veg & Muktai Garden', 'atulya-pure-veg-&-muktai-garden', NULL, 'Pune, India', 1, 0, '2026-10-12 15:29:06', '2026-10-12 15:29:06', 'Pune', 'Pune', '18.45547210', '73.79846170', '4.80', NULL, 1, 1, 'active', NULL),
(43, 1, 'Hotel Jagdamb', 'hotel-jagdamb', NULL, 'Pune, India', 1, 0, '2026-10-12 16:39:22', '2026-10-12 16:39:30', 'Pune', 'Pune', '18.45500000', '73.80100000', '4.80', NULL, 1, 2, 'active', NULL),
(44, 1, 'Saraswati Misal & Snacks', 'saraswati-misal-&-snacks', NULL, 'Pune, India', 1, 0, '2026-10-12 16:39:50', '2026-10-12 16:39:50', 'Pune', 'Pune', '18.45300000', '73.80400000', '4.80', NULL, 1, 1, 'active', NULL),
(45, 1, 'Durga Cafe', 'durga-cafe', NULL, 'Pune, India', 1, 0, '2026-10-13 09:54:28', '2026-10-13 09:54:28', 'Pune', 'Pune', '18.45435350', '73.78974711', '4.80', NULL, 1, 1, 'active', NULL),
(46, 1, 'Ganraj Hotel Bajirao Road', 'ganraj-hotel-bajirao-road', NULL, 'Pune, India', 1, 0, '2026-10-13 09:55:17', '2026-10-13 16:42:04', 'Pune', 'Pune', '18.45435350', '73.78974711', '4.80', NULL, 1, 4, 'active', NULL),
(47, 1, 'Irani Cafe Prabhat Road', 'irani-cafe-prabhat-road', NULL, 'Pune, India', 1, 0, '2026-10-13 10:02:27', '2026-10-13 10:02:39', 'Pune', 'Pune', '18.45435350', '73.78974711', '4.80', NULL, 1, 2, 'active', NULL),
(48, 1, 'Mathura & Atulya Pure Veg & Shree Radha Krishna Pure Veg', 'mathura-&-atulya-pure-veg-&-shree-radha-krishna-pure-veg', NULL, 'Pune, India', 1, 0, '2026-10-13 10:46:28', '2026-10-13 10:46:28', 'Pune', 'Pune', '18.51892790', '73.84465930', '4.80', NULL, 1, 1, 'active', NULL),
(49, 1, 'Sandeep', 'sandeep', NULL, 'Pune, India', 1, 0, '2026-10-13 13:43:06', '2026-10-13 13:43:08', 'Pune', 'Pune', '18.52292610', '73.84748460', '4.80', NULL, 1, 2, 'active', NULL),
(50, 1, 'parampara', 'parampara', NULL, 'Pune, India', 1, 0, '2026-10-13 13:43:41', '2026-10-13 13:44:06', 'Pune', 'Pune', '18.52348360', '73.84701970', '4.80', NULL, 1, 2, 'active', NULL),
(51, 1, 'Sandeep & parampara', 'sandeep-&-parampara', NULL, 'Pune, India', 1, 0, '2026-10-13 13:45:03', '2026-10-13 13:45:03', 'Pune', 'Pune', '18.52292610', '73.84748460', '4.80', NULL, 1, 1, 'active', NULL),
(52, 1, 'Asha Dining Hall', 'asha-dining-hall', NULL, 'Pune, India', 1, 0, '2026-10-13 14:41:04', '2026-10-13 15:37:43', 'Pune', 'Pune', '18.51983790', '73.84300940', '4.80', NULL, 1, 6, 'active', NULL),
(53, 1, 'Vaidya Upahar Gruha', 'vaidya-upahar-gruha', NULL, 'Pune, India', 1, 0, '2026-10-13 15:35:24', '2026-10-13 15:35:24', 'Pune', 'Pune', '18.51794940', '73.85917570', '4.80', NULL, 1, 1, 'active', NULL),
(54, 1, 'Vaidya Upahar Gruha & Asha Dining Hall', 'vaidya-upahar-gruha-&-asha-dining-hall', NULL, 'Pune, India', 1, 0, '2026-10-13 15:56:24', '2026-10-13 15:56:24', 'Pune', 'Pune', '18.51794940', '73.85917570', '4.80', NULL, 1, 1, 'active', NULL),
(55, 1, 'sameer pan palace', 'sameer-pan-palace', NULL, 'Pune, India', 1, 0, '2026-10-13 15:58:42', '2026-10-13 15:58:47', 'Pune', 'Pune', '18.51283950', '73.84468590', '4.80', NULL, 1, 2, 'active', NULL),
(56, 1, 'Chirp', 'chirp', NULL, 'Pune, India', 1, 0, '2026-10-13 15:59:12', '2026-10-13 16:00:14', 'Pune', 'Pune', '18.52231890', '73.84382250', '4.80', NULL, 1, 2, 'active', NULL),
(57, 1, 'Jagaat Bhaari Kolhapuri', 'jagaat-bhaari-kolhapuri', NULL, 'pune, India', 1, 0, '2026-10-13 16:42:37', '2026-10-13 16:43:14', 'pune', 'pune', '18.52110000', '73.85020000', '4.80', NULL, 1, 2, 'active', NULL),
(58, 1, 'Ganraj Hotel Bajirao Road & Jagaat Bhaari Kolhapuri', 'ganraj-hotel-bajirao-road-&-jagaat-bhaari-kolhapuri', NULL, 'pune, India', 1, 0, '2026-10-13 16:43:48', '2026-10-13 16:43:48', 'pune', 'pune', '18.52110000', '73.85020000', '4.80', NULL, 1, 1, 'active', NULL),
(59, 1, 'Gandharva', 'gandharva', NULL, 'Pune, India', 1, 0, '2026-10-16 07:46:29', '2026-10-16 07:46:29', 'Pune', 'Pune', '18.52264650', '73.84908510', '4.80', NULL, 1, 1, 'active', NULL),
(60, 1, 'Athavale Silver Leaf', 'athavale-silver-leaf', NULL, 'Pune, India', 1, 0, '2026-10-16 07:47:51', '2026-10-16 07:48:14', 'Pune', 'Pune', '18.52329850', '73.84740670', '4.80', NULL, 1, 2, 'active', NULL),
(61, 1, 'Royal', 'royal', NULL, 'Pune, India', 1, 0, '2026-10-16 08:17:09', '2026-10-16 08:22:04', 'Pune', 'Pune', '18.52110000', '73.85020000', '4.80', NULL, 1, 2, 'active', NULL),
(62, 1, 'Royal & Jagaat Bhaari Kolhapuri', 'royal-&-jagaat-bhaari-kolhapuri', NULL, 'Pune, India', 1, 0, '2026-10-16 08:30:38', '2026-10-16 08:30:38', 'Pune', 'Pune', '18.52110000', '73.85020000', '4.80', NULL, 1, 1, 'active', NULL),
(63, 1, 'Truffles', 'truffles', NULL, 'Pune, India', 1, 0, '2026-10-16 09:18:11', '2026-10-16 09:22:31', 'Pune', 'Pune', '18.52110000', '73.85020000', '4.80', NULL, 1, 2, 'active', NULL),
(64, 1, 'Karim\'s', 'karim\'s', NULL, 'Pune, India', 1, 0, '2026-10-16 09:45:05', '2026-10-16 09:55:21', 'Pune', 'Pune', '18.51325173', '73.83909463', '4.80', NULL, 1, 2, 'active', NULL),
(65, 1, 'Poona Guest House', 'poona-guest-house', NULL, 'Pune, India', 1, 0, '2026-10-16 10:12:25', '2026-10-16 10:12:37', 'Pune', 'Pune', '18.51400000', '73.85400000', '4.80', NULL, 1, 2, 'active', NULL),
(66, 1, 'Poona Guest House & Jagaat Bhaari Kolhapuri', 'poona-guest-house-&-jagaat-bhaari-kolhapuri', NULL, 'Pune, India', 1, 0, '2026-10-16 10:13:01', '2026-10-16 10:13:01', 'Pune', 'Pune', '18.51400000', '73.85400000', '4.80', NULL, 1, 1, 'active', NULL);

-- Restaurant verification columns (strict verified mode).
-- All rows above are legacy/unverified (is_verified = 0): kept for history/admin review, hidden from users.
ALTER TABLE `restaurants`
  ADD COLUMN `swiggy_id` varchar(32) DEFAULT NULL,
  ADD COLUMN `verification_source` varchar(32) DEFAULT NULL,
  ADD COLUMN `fssai_license` varchar(20) DEFAULT NULL,
  ADD COLUMN `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN `verified_at` timestamp NULL DEFAULT NULL,
  ADD INDEX `idx_restaurants_swiggy` (`swiggy_id`);

-- --------------------------------------------------------
-- Table structure for table `dishes`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `dishes`;
CREATE TABLE `dishes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `restaurant_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL COMMENT 'Dish name (e.g. Mysore Cheese Masala Dosa)',
  `slug` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `default_spice_level` tinyint(4) NOT NULL DEFAULT 3 COMMENT '1: Mild, 3: Medium/Masaledaar, 5: Fire',
  `is_signature` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `video_id` int(11) DEFAULT NULL COMMENT 'Primary Bakasur video eating this dish',
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `price` decimal(8,2) DEFAULT 150.00,
  `image` varchar(1000) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 4.70,
  `popularity` int(11) DEFAULT 95,
  `is_recommended` tinyint(1) DEFAULT 1,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `idx_dishes_restaurant` (`restaurant_id`,`is_active`,`display_order`),
  KEY `idx_dishes_video` (`video_id`),
  CONSTRAINT `dishes_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dishes_ibfk_2` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `dishes` (100 rows)
INSERT INTO `dishes` VALUES
(1, 1, 'Special Paneer Butter Masala', 'special-paneer-butter-masala', NULL, 3, 1, 1, NULL, 0, '2026-10-09 06:09:08', '2026-10-09 06:09:08', '180.00', NULL, '4.80', 90, 1, 'active'),
(2, 2, 'Sizzling Brownie with Vanilla Ice Cream', 'sizzling-brownie-with-vanilla-ice-cream', NULL, 3, 1, 1, NULL, 0, '2026-10-09 06:15:29', '2026-10-09 06:15:29', '180.00', NULL, '4.80', 90, 1, 'active'),
(3, 3, 'Special Gulab Jamun with Rabdi (2 Pcs)', 'special-gulab-jamun-with-rabdi-(2-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-09 06:53:48', '2026-10-09 06:53:48', '180.00', NULL, '4.80', 90, 1, 'active'),
(4, 3, 'Atulya Special Paneer Butter Masala', 'atulya-special-paneer-butter-masala', NULL, 3, 1, 1, NULL, 0, '2026-10-09 07:53:24', '2026-10-09 07:53:24', '180.00', NULL, '4.80', 90, 1, 'active'),
(5, 4, 'Veg Grilled Cheese Sandwich', 'veg-grilled-cheese-sandwich', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:15:40', '2026-10-09 08:15:40', '180.00', NULL, '4.80', 90, 1, 'active'),
(6, 4, 'Special Kanda Poha Plate with Sev & Lemon', 'special-kanda-poha-plate-with-sev-&-lemon', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:15:45', '2026-10-09 08:15:45', '180.00', NULL, '4.80', 90, 1, 'active'),
(7, 4, 'Durga Special Spiced Misal Pav', 'durga-special-spiced-misal-pav', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:17:20', '2026-10-09 08:17:20', '180.00', NULL, '4.80', 90, 1, 'active'),
(8, 5, 'Maharastrian Thali (1 Person )', 'maharastrian-thali-(1-person-)', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:38:30', '2026-10-09 08:38:30', '180.00', NULL, '4.80', 90, 1, 'active'),
(9, 6, 'HD Penne Pink Sauce', 'hd-penne-pink-sauce', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:39:06', '2026-10-09 08:39:06', '180.00', NULL, '4.80', 90, 1, 'active'),
(10, 7, 'Punjabi Sweet Lassi Malai Mar Ke', 'punjabi-sweet-lassi-malai-mar-ke', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:40:02', '2026-10-09 08:40:02', '180.00', NULL, '4.80', 90, 1, 'active'),
(11, 7, 'Royal Shahi Kaju Kari', 'royal-shahi-kaju-kari', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:41:59', '2026-10-09 08:41:59', '180.00', NULL, '4.80', 90, 1, 'active'),
(12, 8, 'Podi Idli', 'podi-idli', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:43:41', '2026-10-09 08:43:41', '180.00', NULL, '4.80', 90, 1, 'active'),
(13, 8, 'Cut Dosa', 'cut-dosa', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:44:06', '2026-10-09 08:44:06', '180.00', NULL, '4.80', 90, 1, 'active'),
(14, 9, 'Classic Pizzas Pack Of 4 - Veg.', 'classic-pizzas-pack-of-4---veg.', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:45:27', '2026-10-09 08:45:27', '180.00', NULL, '4.80', 90, 1, 'active'),
(15, 6, 'Durga Famous Thick Cold Coffee with Chocolate', 'durga-famous-thick-cold-coffee-with-chocolate', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:51:10', '2026-10-09 08:51:10', '180.00', NULL, '4.80', 90, 1, 'active'),
(16, 6, 'HD Spaghetti Aglio Olio', 'hd-spaghetti-aglio-olio', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:51:17', '2026-10-09 08:51:17', '180.00', NULL, '4.80', 90, 1, 'active'),
(17, 3, 'Hot Gulab Jamun in Saffron Syrup (2 Pcs)', 'hot-gulab-jamun-in-saffron-syrup-(2-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:54:53', '2026-10-09 08:54:53', '180.00', NULL, '4.80', 90, 1, 'active'),
(18, 3, 'Tandoori Paneer Tikka (6 Pcs)', 'tandoori-paneer-tikka-(6-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:55:17', '2026-10-09 08:55:17', '180.00', NULL, '4.80', 90, 1, 'active'),
(19, 3, 'Atulya Special Maharaja Veg Thali', 'atulya-special-maharaja-veg-thali', NULL, 3, 1, 1, NULL, 0, '2026-10-09 08:56:44', '2026-10-09 08:56:44', '180.00', NULL, '4.80', 90, 1, 'active'),
(20, 23, 'Chicken Hot Dog Roll', 'chicken-hot-dog-roll', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:11:36', '2026-10-12 09:11:36', '180.00', NULL, '4.80', 90, 1, 'active'),
(21, 24, 'Crispy Butter Garlic Naan (2 Pcs)', 'crispy-butter-garlic-naan-(2-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:12:43', '2026-10-12 09:12:43', '180.00', NULL, '4.80', 90, 1, 'active'),
(22, 24, 'Thali', 'thali', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:12:54', '2026-10-12 09:12:54', '180.00', NULL, '4.80', 90, 1, 'active'),
(23, 3, 'Royal Shahi Kaju Kari', 'royal-shahi-kaju-kari', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:28:02', '2026-10-12 09:28:02', '180.00', NULL, '4.80', 90, 1, 'active'),
(24, 9, 'Green Peas Pulao', 'green-peas-pulao', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:32:25', '2026-10-12 09:32:25', '180.00', NULL, '4.80', 90, 1, 'active'),
(25, 9, 'Vada (1Pc)', 'vada-(1pc)', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:32:45', '2026-10-12 09:32:45', '180.00', NULL, '4.80', 90, 1, 'active'),
(26, 9, 'Vada Pav 1 Pc', 'vada-pav-1-pc', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:32:56', '2026-10-12 09:32:56', '180.00', NULL, '4.80', 90, 1, 'active'),
(27, 25, 'Dal Baati Thali (5 Baati + Dal Tadka + Churma + Salad + Chaas)', 'dal-baati-thali-(5-baati-+-dal-tadka-+-churma-+-salad-+-chaas)', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:33:33', '2026-10-12 09:33:33', '180.00', NULL, '4.80', 90, 1, 'active'),
(28, 7, 'Grand Shahi Maharaja Veg Thali', 'grand-shahi-maharaja-veg-thali', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:34:08', '2026-10-12 09:34:08', '180.00', NULL, '4.80', 90, 1, 'active'),
(29, 7, 'Crispy Butter Garlic Naan (2 Pcs)', 'crispy-butter-garlic-naan-(2-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:34:20', '2026-10-12 09:34:20', '180.00', NULL, '4.80', 90, 1, 'active'),
(30, 7, 'Fragrant Jeera Rice & Yellow Dal Tadka', 'fragrant-jeera-rice-&-yellow-dal-tadka', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:34:31', '2026-10-12 09:34:31', '180.00', NULL, '4.80', 90, 1, 'active'),
(31, 7, 'Spicy Veg Kolhapuri Gravy', 'spicy-veg-kolhapuri-gravy', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:34:39', '2026-10-12 09:34:39', '180.00', NULL, '4.80', 90, 1, 'active'),
(32, 26, 'Spicy Veg Kolhapuri Gravy', 'spicy-veg-kolhapuri-gravy', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:47:19', '2026-10-12 09:47:19', '180.00', NULL, '4.80', 90, 1, 'active'),
(33, 26, 'Cheese Masala Dosa', 'cheese-masala-dosa', NULL, 3, 1, 1, NULL, 0, '2026-10-12 09:47:23', '2026-10-12 09:47:23', '180.00', NULL, '4.80', 90, 1, 'active'),
(34, 27, 'Margherita', 'margherita', NULL, 3, 1, 1, NULL, 0, '2026-10-12 10:19:49', '2026-10-12 10:19:49', '180.00', NULL, '4.80', 90, 1, 'active'),
(35, 28, 'Veg Clear Soup', 'veg-clear-soup', NULL, 3, 1, 1, NULL, 0, '2026-10-12 10:29:20', '2026-10-12 10:29:20', '180.00', NULL, '4.80', 90, 1, 'active'),
(36, 28, 'Paneer Manchurian', 'paneer-manchurian', NULL, 3, 1, 1, NULL, 0, '2026-10-12 10:35:15', '2026-10-12 10:35:15', '180.00', NULL, '4.80', 90, 1, 'active'),
(37, 28, 'Paneer Pakora', 'paneer-pakora', NULL, 3, 1, 1, NULL, 0, '2026-10-12 10:35:28', '2026-10-12 10:35:28', '180.00', NULL, '4.80', 90, 1, 'active'),
(38, 28, 'Aloo Jeera', 'aloo-jeera', NULL, 3, 1, 1, NULL, 0, '2026-10-12 10:45:40', '2026-10-12 10:45:40', '180.00', NULL, '4.80', 90, 1, 'active'),
(39, 29, 'Dal fry', 'dal-fry', NULL, 3, 1, 1, NULL, 0, '2026-10-12 10:48:19', '2026-10-12 10:48:19', '180.00', NULL, '4.80', 90, 1, 'active'),
(40, 29, 'Veg Maratha', 'veg-maratha', NULL, 3, 1, 1, NULL, 0, '2026-10-12 10:58:23', '2026-10-12 10:58:23', '180.00', NULL, '4.80', 90, 1, 'active'),
(41, 30, 'Spring Dosa', 'spring-dosa', NULL, 3, 1, 1, NULL, 0, '2026-10-12 11:06:31', '2026-10-12 11:06:31', '180.00', NULL, '4.80', 90, 1, 'active'),
(42, 31, 'Kitkat Shake', 'kitkat-shake', NULL, 3, 1, 1, NULL, 0, '2026-10-12 11:08:24', '2026-10-12 11:08:24', '180.00', NULL, '4.80', 90, 1, 'active'),
(43, 32, 'Coffee cake', 'coffee-cake', NULL, 3, 1, 1, NULL, 0, '2026-10-12 12:07:10', '2026-10-12 12:07:10', '180.00', NULL, '4.80', 90, 1, 'active'),
(44, 33, 'Sukha Bhel', 'sukha-bhel', NULL, 3, 1, 1, NULL, 0, '2026-10-12 12:09:18', '2026-10-12 12:09:18', '180.00', NULL, '4.80', 90, 1, 'active'),
(45, 33, 'Single Special Dabeli', 'single-special-dabeli', NULL, 3, 1, 1, NULL, 0, '2026-10-12 12:09:34', '2026-10-12 12:09:34', '180.00', NULL, '4.80', 90, 1, 'active'),
(46, 33, 'Mango Milkshake', 'mango-milkshake', NULL, 3, 1, 1, NULL, 0, '2026-10-12 12:15:43', '2026-10-12 12:15:43', '180.00', NULL, '4.80', 90, 1, 'active'),
(47, 33, 'Single Special Ragada Pattice', 'single-special-ragada-pattice', NULL, 3, 1, 1, NULL, 0, '2026-10-12 12:19:28', '2026-10-12 12:19:28', '180.00', NULL, '4.80', 90, 1, 'active'),
(48, 34, 'Pani Puri Platter (6 Pcs)', 'pani-puri-platter-(6-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-12 12:21:46', '2026-10-12 12:21:46', '180.00', NULL, '4.80', 90, 1, 'active'),
(49, 35, 'Dal Makhani Charcoal Simmered', 'dal-makhani-charcoal-simmered', NULL, 3, 1, 1, NULL, 0, '2026-10-12 12:23:59', '2026-10-12 12:23:59', '180.00', NULL, '4.80', 90, 1, 'active'),
(50, 32, 'Mud cake', 'mud-cake', NULL, 3, 1, 1, NULL, 0, '2026-10-12 12:44:23', '2026-10-12 12:44:23', '180.00', NULL, '4.80', 90, 1, 'active'),
(51, 26, 'Grand Shahi Maharaja Veg Thali', 'grand-shahi-maharaja-veg-thali', NULL, 3, 1, 1, NULL, 0, '2026-10-12 13:26:08', '2026-10-12 13:26:08', '180.00', NULL, '4.80', 90, 1, 'active'),
(52, 36, 'Mysore Masala Dosa', 'mysore-masala-dosa', NULL, 3, 1, 1, NULL, 0, '2026-10-12 14:07:18', '2026-10-12 14:07:18', '180.00', NULL, '4.80', 90, 1, 'active'),
(53, 37, 'Shrewsbury Biscuits', 'shrewsbury-biscuits', NULL, 3, 1, 1, NULL, 0, '2026-10-12 14:07:18', '2026-10-12 14:07:18', '180.00', NULL, '4.80', 90, 1, 'active'),
(54, 38, 'Mysore Masala Dosa & Shrewsbury Biscuits', 'mysore-masala-dosa-&-shrewsbury-biscuits', NULL, 3, 1, 1, NULL, 0, '2026-10-12 14:07:19', '2026-10-12 14:07:19', '180.00', NULL, '4.80', 90, 1, 'active'),
(55, 39, 'Crispy Butter Garlic Naan (2 Pcs)', 'crispy-butter-garlic-naan-(2-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-12 14:13:32', '2026-10-12 14:13:32', '180.00', NULL, '4.80', 90, 1, 'active'),
(56, 39, 'Dal Makhani Charcoal Simmered', 'dal-makhani-charcoal-simmered', NULL, 3, 1, 1, NULL, 0, '2026-10-12 14:13:43', '2026-10-12 14:13:43', '180.00', NULL, '4.80', 90, 1, 'active'),
(57, 1, 'Punjabi Sweet Lassi Malai Mar Ke', 'punjabi-sweet-lassi-malai-mar-ke', NULL, 3, 1, 1, NULL, 0, '2026-10-12 14:14:27', '2026-10-12 14:14:27', '180.00', NULL, '4.80', 90, 1, 'active'),
(58, 40, 'Dal Makhani Charcoal Simmered & Punjabi Sweet Lassi Malai Mar Ke', 'dal-makhani-charcoal-simmered-&-punjabi-sweet-lassi-malai-mar-ke', NULL, 3, 1, 1, NULL, 0, '2026-10-12 14:15:35', '2026-10-12 14:15:35', '180.00', NULL, '4.80', 90, 1, 'active'),
(59, 41, 'Fragrant Jeera Rice & Yellow Dal Tadka', 'fragrant-jeera-rice-&-yellow-dal-tadka', NULL, 3, 1, 1, NULL, 0, '2026-10-12 14:27:47', '2026-10-12 14:27:47', '180.00', NULL, '4.80', 90, 1, 'active'),
(60, 39, 'Kulkarni\'s Kitchen Signature Garma Garam Pithla Bhakri with Thecha & Kanda', 'kulkarni\'s-kitchen-signature-garma-garam-pithla-bhakri-with-thecha-&-kanda', NULL, 3, 1, 1, NULL, 0, '2026-10-12 14:54:43', '2026-10-12 14:54:43', '180.00', NULL, '4.80', 90, 1, 'active'),
(61, 39, 'Puran Poli Thali with Pure Desi Ghee', 'puran-poli-thali-with-pure-desi-ghee', NULL, 3, 1, 1, NULL, 0, '2026-10-12 14:54:50', '2026-10-12 14:54:50', '180.00', NULL, '4.80', 90, 1, 'active'),
(62, 9, 'Crispy Butter Garlic Naan (2 Pcs)', 'crispy-butter-garlic-naan-(2-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-12 15:27:39', '2026-10-12 15:27:39', '180.00', NULL, '4.80', 90, 1, 'active'),
(63, 42, 'Atulya Special Paneer Butter Masala & Crispy Butter Garlic Naan (2 Pcs)', 'atulya-special-paneer-butter-masala-&-crispy-butter-garlic-naan-(2-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-12 15:29:08', '2026-10-12 15:29:08', '180.00', NULL, '4.80', 90, 1, 'active'),
(64, 43, 'Ghee Karam Idli', 'ghee-karam-idli', NULL, 3, 1, 1, NULL, 0, '2026-10-12 16:39:22', '2026-10-12 16:39:22', '180.00', NULL, '4.80', 90, 1, 'active'),
(65, 44, 'Saraswati Misal Special Fiery Kolhapuri Tarri Misal Pav', 'saraswati-misal-special-fiery-kolhapuri-tarri-misal-pav', NULL, 3, 1, 1, NULL, 0, '2026-10-12 16:39:50', '2026-10-12 16:39:50', '180.00', NULL, '4.80', 90, 1, 'active'),
(66, 24, 'Steamed Ukdiche Modak with Saffron Ghee (2 Pcs)', 'steamed-ukdiche-modak-with-saffron-ghee-(2-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-13 06:53:17', '2026-10-13 06:53:17', '180.00', NULL, '4.80', 90, 1, 'active'),
(67, 25, 'Crispy Kothimbir Vadi with Mint Chutney', 'crispy-kothimbir-vadi-with-mint-chutney', NULL, 3, 1, 1, NULL, 0, '2026-10-13 07:07:01', '2026-10-13 07:07:01', '180.00', NULL, '4.80', 90, 1, 'active'),
(68, 25, 'Digestive Pink Kokum Solkadhi', 'digestive-pink-kokum-solkadhi', NULL, 3, 1, 1, NULL, 0, '2026-10-13 07:25:42', '2026-10-13 07:25:42', '180.00', NULL, '4.80', 90, 1, 'active'),
(69, 7, 'Shree Radha Special Paneer Butter Masala', 'shree-radha-special-paneer-butter-masala', NULL, 3, 1, 1, NULL, 0, '2026-10-13 09:24:30', '2026-10-13 09:24:30', '180.00', NULL, '4.80', 90, 1, 'active'),
(70, 45, 'Durga Special Spiced Misal Pav', 'durga-special-spiced-misal-pav', NULL, 3, 1, 1, NULL, 0, '2026-10-13 09:54:28', '2026-10-13 09:54:28', '180.00', NULL, '4.80', 90, 1, 'active'),
(71, 46, 'Spicy Veg Kolhapuri Gravy', 'spicy-veg-kolhapuri-gravy', NULL, 3, 1, 1, NULL, 0, '2026-10-13 09:55:18', '2026-10-13 09:55:18', '180.00', NULL, '4.80', 90, 1, 'active'),
(72, 47, 'Bun Maska & Irani Chai', 'bun-maska-&-irani-chai', NULL, 3, 1, 1, NULL, 0, '2026-10-13 10:02:27', '2026-10-13 10:02:27', '180.00', NULL, '4.80', 90, 1, 'active'),
(73, 29, 'Paneer Butter Masala', 'paneer-butter-masala', NULL, 3, 1, 1, NULL, 0, '2026-10-13 10:42:22', '2026-10-13 10:42:22', '180.00', NULL, '4.80', 90, 1, 'active'),
(74, 48, 'Paneer Butter Masala & Special Gulab Jamun with Rabdi (2 Pcs) & Shree Radha Special Paneer Butter Masala', 'paneer-butter-masala-&-special-gulab-jamun-with-rabdi-(2-pcs)-&-shree-radha-special-paneer-butter-masala', NULL, 3, 1, 1, NULL, 0, '2026-10-13 10:46:29', '2026-10-13 10:46:29', '180.00', NULL, '4.80', 90, 1, 'active'),
(75, 49, 'Special Kolhapuri Mutton Thali (Tambda & Pandhra Rassa)', 'special-kolhapuri-mutton-thali-(tambda-&-pandhra-rassa)', NULL, 3, 1, 1, NULL, 0, '2026-10-13 13:43:07', '2026-10-13 13:43:07', '180.00', NULL, '4.80', 90, 1, 'active'),
(76, 49, 'Traditional Solkadhi Glass', 'traditional-solkadhi-glass', NULL, 3, 1, 1, NULL, 0, '2026-10-13 13:43:09', '2026-10-13 13:43:09', '180.00', NULL, '4.80', 90, 1, 'active'),
(77, 50, 'Mysore Butter Masala Dosa', 'mysore-butter-masala-dosa', NULL, 3, 1, 1, NULL, 0, '2026-10-13 13:43:42', '2026-10-13 13:43:42', '180.00', NULL, '4.80', 90, 1, 'active'),
(78, 51, 'Traditional Solkadhi Glass & Mysore Butter Masala Dosa', 'traditional-solkadhi-glass-&-mysore-butter-masala-dosa', NULL, 3, 1, 1, NULL, 0, '2026-10-13 13:45:03', '2026-10-13 13:45:03', '180.00', NULL, '4.80', 90, 1, 'active'),
(79, 52, 'Chocolate Truffle Cake (1 pound)', 'chocolate-truffle-cake-(1-pound)', NULL, 3, 1, 1, NULL, 0, '2026-10-13 14:41:04', '2026-10-13 14:41:04', '180.00', NULL, '4.80', 90, 1, 'active'),
(80, 52, 'Authentic Bhajani Thalipeeth with White Butter', 'authentic-bhajani-thalipeeth-with-white-butter', NULL, 3, 1, 1, NULL, 0, '2026-10-13 14:41:09', '2026-10-13 14:41:09', '180.00', NULL, '4.80', 90, 1, 'active'),
(81, 52, 'Khandeshi Shev Bhaji with Pav', 'khandeshi-shev-bhaji-with-pav', NULL, 3, 1, 1, NULL, 0, '2026-10-13 14:41:18', '2026-10-13 14:41:18', '180.00', NULL, '4.80', 90, 1, 'active'),
(82, 52, 'Jar Cake Pineapple', 'jar-cake-pineapple', NULL, 3, 1, 1, NULL, 0, '2026-10-13 14:41:31', '2026-10-13 14:41:31', '180.00', NULL, '4.80', 90, 1, 'active'),
(83, 6, 'Veg Kofta', 'veg-kofta', NULL, 3, 1, 1, NULL, 0, '2026-10-13 15:33:10', '2026-10-13 15:33:10', '180.00', NULL, '4.80', 90, 1, 'active'),
(84, 6, 'Chole Khulche', 'chole-khulche', NULL, 3, 1, 1, NULL, 0, '2026-10-13 15:34:10', '2026-10-13 15:34:10', '180.00', NULL, '4.80', 90, 1, 'active'),
(85, 53, 'Baby Corn Handi', 'baby-corn-handi', NULL, 3, 1, 1, NULL, 0, '2026-10-13 15:35:24', '2026-10-13 15:35:24', '180.00', NULL, '4.80', 90, 1, 'active'),
(86, 52, 'Black Forest Pastry', 'black-forest-pastry', NULL, 3, 1, 1, NULL, 0, '2026-10-13 15:36:23', '2026-10-13 15:36:23', '180.00', NULL, '4.80', 90, 1, 'active'),
(87, 54, 'Baby Corn Handi & Black Forest Pastry', 'baby-corn-handi-&-black-forest-pastry', NULL, 3, 1, 1, NULL, 0, '2026-10-13 15:56:24', '2026-10-13 15:56:24', '180.00', NULL, '4.80', 90, 1, 'active'),
(88, 55, 'Special Paneer Butter Masala', 'special-paneer-butter-masala', NULL, 3, 1, 1, NULL, 0, '2026-10-13 15:58:43', '2026-10-13 15:58:43', '180.00', NULL, '4.80', 90, 1, 'active'),
(89, 56, 'Dal Makhani Charcoal Simmered', 'dal-makhani-charcoal-simmered', NULL, 3, 1, 1, NULL, 0, '2026-10-13 15:59:12', '2026-10-13 15:59:12', '180.00', NULL, '4.80', 90, 1, 'active'),
(90, 46, 'Dal Tadka Dhaba Style [Steamed Rice] Bowl', 'dal-tadka-dhaba-style-[steamed-rice]-bowl', NULL, 3, 1, 1, NULL, 0, '2026-10-13 16:42:05', '2026-10-13 16:42:05', '180.00', NULL, '4.80', 90, 1, 'active'),
(91, 57, 'Akkha Masoor Dal', 'akkha-masoor-dal', NULL, 3, 1, 1, NULL, 0, '2026-10-13 16:42:38', '2026-10-13 16:42:38', '180.00', NULL, '4.80', 90, 1, 'active'),
(92, 58, 'Dal Tadka Dhaba Style [Steamed Rice] Bowl & Akkha Masoor Dal', 'dal-tadka-dhaba-style-[steamed-rice]-bowl-&-akkha-masoor-dal', NULL, 3, 1, 1, NULL, 0, '2026-10-13 16:43:48', '2026-10-13 16:43:48', '180.00', NULL, '4.80', 90, 1, 'active'),
(93, 59, 'Hyderabadi Chicken Dum Biryani', 'hyderabadi-chicken-dum-biryani', NULL, 3, 1, 1, NULL, 0, '2026-10-16 07:46:30', '2026-10-16 07:46:30', '180.00', NULL, '4.80', 90, 1, 'active'),
(94, 60, 'Special Amul Butter Pav Bhaji', 'special-amul-butter-pav-bhaji', NULL, 3, 1, 1, NULL, 0, '2026-10-16 07:47:51', '2026-10-16 07:47:51', '180.00', NULL, '4.80', 90, 1, 'active'),
(95, 61, 'Special Amul Butter Pav Bhaji', 'special-amul-butter-pav-bhaji', NULL, 3, 1, 1, NULL, 0, '2026-10-16 08:17:09', '2026-10-16 08:17:09', '180.00', NULL, '4.80', 90, 1, 'active'),
(96, 62, 'Special Amul Butter Pav Bhaji & Akkha Masoor Dal', 'special-amul-butter-pav-bhaji-&-akkha-masoor-dal', NULL, 3, 1, 1, NULL, 0, '2026-10-16 08:30:38', '2026-10-16 08:30:38', '180.00', NULL, '4.80', 90, 1, 'active'),
(97, 63, 'Special Amul Butter Pav Bhaji', 'special-amul-butter-pav-bhaji', NULL, 3, 1, 1, NULL, 0, '2026-10-16 09:18:11', '2026-10-16 09:18:11', '180.00', NULL, '4.80', 90, 1, 'active'),
(98, 64, 'Fluffy Butter Garlic Naan (2 Pcs)', 'fluffy-butter-garlic-naan-(2-pcs)', NULL, 3, 1, 1, NULL, 0, '2026-10-16 09:45:06', '2026-10-16 09:45:06', '180.00', NULL, '4.80', 90, 1, 'active'),
(99, 65, 'Traditional Puneri Maharashtrian Thali', 'traditional-puneri-maharashtrian-thali', NULL, 3, 1, 1, NULL, 0, '2026-10-16 10:12:25', '2026-10-16 10:12:25', '180.00', NULL, '4.80', 90, 1, 'active'),
(100, 66, 'Traditional Puneri Maharashtrian Thali & Akkha Masoor Dal', 'traditional-puneri-maharashtrian-thali-&-akkha-masoor-dal', NULL, 3, 1, 1, NULL, 0, '2026-10-16 10:13:01', '2026-10-16 10:13:01', '180.00', NULL, '4.80', 90, 1, 'active');

-- --------------------------------------------------------
-- Table structure for table `bakasur_videos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `bakasur_videos`;
CREATE TABLE `bakasur_videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `restaurant_id` int(11) DEFAULT NULL,
  `dish_id` int(11) DEFAULT NULL,
  `stage` varchar(50) NOT NULL,
  `stage_number` int(11) DEFAULT 1,
  `video_url` varchar(1000) NOT NULL,
  `thumbnail` varchar(1000) DEFAULT NULL,
  `duration` int(11) DEFAULT 15,
  `meter_percentage` int(11) NOT NULL DEFAULT 20,
  `message` text NOT NULL,
  `cta_text` varchar(100) DEFAULT '???? AUR KHILO',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_rest_dish_stage` (`restaurant_id`,`dish_id`,`stage`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `bakasur_videos` (5 rows)
INSERT INTO `bakasur_videos` VALUES
(1, NULL, NULL, 'intro', 1, '/uploads/videos/1.mp4', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80', 12, 20, 'Main hoon Bakasur! Meri bhookh ka koi ant nahi! Chal mujhe koi zabardast jagah le chal!', '???? START THE FOOD TOUR', 'active', '2026-09-11 11:34:24', '2026-09-11 11:34:24'),
(2, NULL, NULL, 'stage_1', 1, '/uploads/videos/1.mp4', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', 15, 20, 'Waah! Pehla niwala toh zabardast tha! Par Bakasur ka pet abhi khaali hai... Aur Khilo!', '??????? AUR KHILO', 'active', '2026-09-11 11:34:24', '2026-09-11 11:34:24'),
(3, NULL, NULL, 'stage_2', 2, '/uploads/videos/2%201.mp4', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80', 16, 45, 'Maza aa raha hai! Lekin Bakasur ko roko mat! Plate par plate aane do... Aur Khilo!', '??????? AUR KHILO', 'active', '2026-09-11 11:34:24', '2026-09-11 11:34:24'),
(4, NULL, NULL, 'stage_3', 3, '/uploads/videos/3%201.mp4', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80', 18, 85, 'Arre baap re... Itna saara masaledaar khana! Mera pet toh ab pathar ho gaya!', '???? FINAL BITE', 'active', '2026-09-11 11:34:24', '2026-09-11 11:34:24'),
(5, NULL, NULL, 'acidity', 4, '/uploads/videos/3%201.mp4', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80', 14, 100, 'Aah! Seene mein jalan aur bhari-pan! Bakasur bhi thak gaya... Bakasur Ko Gastrium Do!', '???? GASTRIUM MOMENT', 'active', '2026-09-11 11:34:24', '2026-09-11 11:34:24');

-- --------------------------------------------------------
-- Table structure for table `campaign_sessions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `campaign_sessions`;
CREATE TABLE `campaign_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `user_location` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `dish_id` int(11) DEFAULT NULL,
  `current_stage` varchar(50) DEFAULT 'start',
  `current_step` varchar(50) DEFAULT 'start',
  `step_count` int(11) DEFAULT 1,
  `food_meter_percentage` int(11) DEFAULT 20,
  `aur_khilo_clicks` int(11) DEFAULT 0,
  `video_completed` tinyint(1) DEFAULT 0,
  `map_visited` tinyint(1) DEFAULT 0,
  `form_submitted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=857 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `campaign_visits`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `campaign_visits`;
CREATE TABLE `campaign_visits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `dish_id` int(11) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `visited_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `restaurant_name` varchar(255) DEFAULT NULL,
  `dish_name` varchar(255) DEFAULT NULL,
  `round_number` int(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_visit_restaurant` (`restaurant_id`),
  KEY `idx_visited_at` (`visited_at`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `campaign_visits` (7 rows)
INSERT INTO `campaign_visits` VALUES
(2, 'bkt_sess_1789470297731_f3fodberu43', 66, 57314, 'Pune', '18.51400000', '73.85400000', '2026-10-16 10:13:01', 'Poona Guest House & Jagaat Bhaari Kolhapuri', 'Traditional Puneri Maharashtrian Thali & Akkha Masoor Dal', 1),
(3, 'bkt_sess_legacy_001', 3, 85004, 'Anandnagar', '18.45547210', '73.79846170', '2026-10-09 06:53:48', 'Atulya Pure Veg', 'Special Gulab Jamun with Rabdi (2 Pcs)', 1),
(23, 'bkt_sess_1789123858588_mhgdge9d060', 59, 14417, 'Pune', '18.52264650', '73.84908510', '2026-10-16 07:46:30', 'Gandharva', 'Hyderabadi Chicken Dum Biryani', 1),
(26, 'bkt_sess_1789123858588_mhgdge9d060', 60, 19370, 'Pune', '18.52329850', '73.84740670', '2026-10-16 07:48:14', 'Athavale Silver Leaf', 'Special Amul Butter Pav Bhaji', 2),
(27, 'sess_1788429722535_s1ew2n', 45, 22406, 'Pune', '18.45435350', '73.78974711', '2026-10-13 09:54:28', 'Durga Cafe', 'Durga Special Spiced Misal Pav', 1),
(28, 'bkt_sess_1789470297731_f3fodberu43', 57, 35205, 'pune', '18.52110000', '73.85020000', '2026-10-13 16:43:14', 'Jagaat Bhaari Kolhapuri', 'Akkha Masoor Dal', 2),
(29, 'sess_1788429722535_s1ew2n', 46, 29781, 'Pune', '18.45435350', '73.78974711', '2026-10-13 10:31:40', 'Ganraj Hotel Bajirao Road', 'Spicy Veg Kolhapuri Gravy', 2);

-- --------------------------------------------------------
-- Table structure for table `participants`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `participants`;
CREATE TABLE `participants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `participation_id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `restaurant_name` varchar(255) DEFAULT NULL,
  `dish_id` int(11) DEFAULT NULL,
  `dish_name` varchar(255) DEFAULT NULL,
  `consent` tinyint(1) DEFAULT 1,
  `terms_accepted` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `participation_id` (`participation_id`),
  UNIQUE KEY `uq_participants_mobile` (`mobile`),
  KEY `idx_participation_id` (`participation_id`),
  KEY `idx_city` (`city`),
  KEY `idx_mobile` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `dish_video_mappings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `dish_video_mappings`;
CREATE TABLE `dish_video_mappings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dish_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `spice_level` tinyint(4) DEFAULT NULL COMMENT 'Optional spice-specific video mapping (1, 3, 5)',
  `is_default` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `video_id` (`video_id`),
  KEY `idx_dish_video` (`dish_id`,`spice_level`),
  CONSTRAINT `dish_video_mappings_ibfk_1` FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dish_video_mappings_ibfk_2` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `menus`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `menus`;
CREATE TABLE `menus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `restaurant_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL DEFAULT 'Main Menu',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_menu_rest_id` (`restaurant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `tour_submissions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `tour_submissions`;
CREATE TABLE `tour_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `location_name` varchar(100) NOT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `restaurant_name` varchar(150) NOT NULL,
  `dish_id` int(11) DEFAULT NULL,
  `dish_name` varchar(150) NOT NULL,
  `spice_level` tinyint(4) NOT NULL DEFAULT 3,
  `video_id` int(11) DEFAULT NULL,
  `is_relieved` tinyint(1) NOT NULL DEFAULT 1,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `location_id` (`location_id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `dish_id` (`dish_id`),
  KEY `video_id` (`video_id`),
  KEY `idx_submissions_created` (`created_at`),
  KEY `idx_submissions_dish` (`dish_name`),
  CONSTRAINT `tour_submissions_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tour_submissions_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tour_submissions_ibfk_3` FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tour_submissions_ibfk_4` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `user_journey_steps`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `user_journey_steps`;
CREATE TABLE `user_journey_steps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `step_number` int(11) NOT NULL DEFAULT 1,
  `step_name` varchar(50) NOT NULL,
  `step_title` varchar(150) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `user_location` varchar(255) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_journey_session` (`session_id`),
  KEY `idx_journey_step` (`step_name`),
  KEY `idx_journey_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=500 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
