-- Booking System Tables
-- Run this in phpMyAdmin or MySQL CLI

CREATE TABLE IF NOT EXISTS ms_booking_events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  site_id     INT NOT NULL,
  name        VARCHAR(255) NOT NULL,
  duration    INT NOT NULL DEFAULT 30 COMMENT 'minutes',
  description TEXT,
  color       VARCHAR(20) DEFAULT '#7c3aed',
  location    VARCHAR(255) DEFAULT '',
  is_active   TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_site (site_id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS ms_booking_availability (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  site_id      INT NOT NULL,
  day_of_week  TINYINT NOT NULL COMMENT '0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat',
  start_time   TIME NOT NULL DEFAULT '09:00:00',
  end_time     TIME NOT NULL DEFAULT '17:00:00',
  is_available TINYINT(1) DEFAULT 1,
  UNIQUE KEY site_day (site_id, day_of_week)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS ms_bookings (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  site_id      INT NOT NULL,
  event_id     INT NOT NULL,
  booker_name  VARCHAR(255) NOT NULL,
  booker_email VARCHAR(255) NOT NULL,
  booker_phone VARCHAR(100) DEFAULT '',
  booking_date DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  notes        TEXT,
  status       ENUM('confirmed','cancelled') DEFAULT 'confirmed',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_site  (site_id),
  INDEX idx_date  (booking_date),
  INDEX idx_event (event_id)
) CHARACTER SET utf8mb4;
