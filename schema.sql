-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jun 01, 2026 at 04:06 PM
-- Server version: 11.8.6-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u174598786_uytr`
--

-- --------------------------------------------------------

--
-- Table structure for table `ms_accounts`
--

CREATE TABLE `ms_accounts` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `plan` enum('free','pro','business') DEFAULT 'free',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ms_accounts`
--

INSERT INTO `ms_accounts` (`id`, `name`, `email`, `password`, `plan`, `created_at`, `updated_at`) VALUES
(1, 'abhi', 'abhi@gmail.com', '$2y$10$SmTr56SvQ7bQnHhjcESUF.WD/Hbdv8ReIf9tpeW33qP2H6qxkp.Mi', 'free', '2026-06-01 09:48:58', '2026-06-01 09:48:58'),
(2, 'test', 'test@gmail.com', '$2y$10$pFae78VxkQwlI2NlkoWulOwdI1q6hrVaw.Ksq5DKhEkmAtNISBRea', 'free', '2026-06-01 10:16:59', '2026-06-01 10:16:59');

-- --------------------------------------------------------

--
-- Table structure for table `ms_hits`
--

CREATE TABLE `ms_hits` (
  `id` int(11) NOT NULL,
  `page_id` int(11) NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `country` varchar(60) DEFAULT NULL,
  `referrer` varchar(255) DEFAULT NULL,
  `visited_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ms_pages`
--

CREATE TABLE `ms_pages` (
  `id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `subdomain` varchar(60) NOT NULL,
  `custom_domain` varchar(255) DEFAULT NULL,
  `category` varchar(80) DEFAULT NULL,
  `template_id` varchar(50) DEFAULT 'template1',
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `is_published` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ms_pages`
--

INSERT INTO `ms_pages` (`id`, `account_id`, `title`, `subdomain`, `custom_domain`, `category`, `template_id`, `settings`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 1, 'abhi', 'abhi', NULL, 'Restaurant & Food', 'template1', '{\"site_type\":\"business\",\"description\":\"sdfsdfd\",\"city\":\"panchkula\",\"phone\":\"+917404745940\",\"whatsapp\":\"+917889173606\",\"address\":\"asdasd\",\"skills\":\"\",\"bio\":\"\",\"instagram\":\"\",\"youtube\":\"\",\"blog_topic\":\"\",\"author\":\"\",\"product_desc\":\"\",\"theme\":\"green\"}', 1, '2026-06-01 09:49:36', '2026-06-01 09:49:36'),
(2, 2, 'sdds', 'sdds', NULL, '', 'template3', '{\"site_type\":\"linktree\",\"description\":\"sdfdsf\",\"city\":\"\",\"phone\":\"\",\"whatsapp\":\"\",\"address\":\"\",\"skills\":\"\",\"bio\":\"sdfsd\",\"instagram\":\"https:\\/\\/pagezaper.com\\/dashboard\\/site\\/create\",\"youtube\":\"https:\\/\\/pagezaper.com\\/dashboard\\/site\\/create\",\"blog_topic\":\"\",\"author\":\"\",\"product_desc\":\"\",\"theme\":\"ink\"}', 1, '2026-06-01 10:22:45', '2026-06-01 10:22:45'),
(3, 1, 'sdfdsf', 'sdfdsf', NULL, '', 'template2', '{\"site_type\":\"freelancer\",\"description\":\"dsfdsfds\",\"city\":\"\",\"phone\":\"\",\"whatsapp\":\"\",\"address\":\"\",\"skills\":\"sdf\",\"bio\":\"\",\"instagram\":\"\",\"youtube\":\"\",\"blog_topic\":\"\",\"author\":\"\",\"product_desc\":\"\",\"theme\":\"red\",\"sections\":null}', 1, '2026-06-01 10:44:53', '2026-06-01 10:44:53');

-- --------------------------------------------------------

--
-- Table structure for table `ms_tiers`
--

CREATE TABLE `ms_tiers` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `price_inr` int(11) DEFAULT 0,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ms_tiers`
--

INSERT INTO `ms_tiers` (`id`, `name`, `price_inr`, `features`, `created_at`) VALUES
(1, 'free', 0, '{\"sites\":1,\"custom_domain\":false,\"analytics\":false,\"remove_brand\":false}', '2026-06-01 09:09:51'),
(2, 'pro', 299, '{\"sites\":10,\"custom_domain\":true,\"analytics\":true,\"remove_brand\":true}', '2026-06-01 09:09:51'),
(3, 'business', 799, '{\"sites\":999,\"custom_domain\":true,\"analytics\":true,\"remove_brand\":true}', '2026-06-01 09:09:51');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('3E5dea_GMuRij7i9whfNfAebfF6E8Tdn', 1780416282, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-06-02T16:04:42.430Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),
('MhxI4QCZ44ic-zUii6NUUe-H6aLl5BqU', 1780416299, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-06-02T16:04:59.303Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),
('NzBWsyfRAUEAhwq9b2MlsJHy3wO_iyr9', 1780416285, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-06-02T16:04:45.277Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),
('UwSr22AVXYhO5Sko9RIDLlVSl3a93ixJ', 1780416257, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-06-02T16:04:17.005Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),
('ZS7jmzERUWUjfoETz_mM2aD9xWQXVVsL', 1780416276, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-06-02T16:04:36.439Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),
('iBFiNHlpvsT5wrxAI4V3vCYT8bc9jseU', 1780416297, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-06-02T16:04:56.926Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),
('lYGg13tEfqYikxapRQX-vH0kJ_0iuOEQ', 1780416308, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-06-02T16:04:25.836Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),
('ltg8_D19berPic-zoYv_dC36TGduTWX4', 1780416300, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-06-02T16:05:00.164Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),
('neG0LXrZ-rINvFUDnODqjTZfyjm5USRh', 1780416308, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-06-02T16:05:08.372Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ms_accounts`
--
ALTER TABLE `ms_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `ms_hits`
--
ALTER TABLE `ms_hits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `page_id` (`page_id`);

--
-- Indexes for table `ms_pages`
--
ALTER TABLE `ms_pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subdomain` (`subdomain`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `ms_tiers`
--
ALTER TABLE `ms_tiers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ms_accounts`
--
ALTER TABLE `ms_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `ms_hits`
--
ALTER TABLE `ms_hits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ms_pages`
--
ALTER TABLE `ms_pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `ms_tiers`
--
ALTER TABLE `ms_tiers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ms_hits`
--
ALTER TABLE `ms_hits`
  ADD CONSTRAINT `ms_hits_ibfk_1` FOREIGN KEY (`page_id`) REFERENCES `ms_pages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ms_pages`
--
ALTER TABLE `ms_pages`
  ADD CONSTRAINT `ms_pages_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `ms_accounts` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
