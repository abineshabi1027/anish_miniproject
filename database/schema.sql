-- ===================================================
-- QUEUELESS - UNIVERSAL VIRTUAL QUEUE MANAGEMENT SYSTEM
-- Database Schema: queueless_db
-- ===================================================

CREATE DATABASE IF NOT EXISTS queueless_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE queueless_db;

-- 1. Users Table (Role-based: CUSTOMER, STAFF, ADMIN)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('CUSTOMER', 'STAFF', 'ADMIN') DEFAULT 'CUSTOMER',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category ENUM(
        'Hospital',
        'Bank',
        'Restaurant',
        'Government Office',
        'College',
        'Salon',
        'Pharmacy',
        'Diagnostic Center',
        'Vehicle Service Center',
        'Customer Service Center',
        'Other'
    ) NOT NULL DEFAULT 'Other',
    address TEXT NOT NULL,
    location VARCHAR(100) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(150) NOT NULL,
    opening_time TIME NOT NULL DEFAULT '09:00:00',
    closing_time TIME NOT NULL DEFAULT '18:00:00',
    status ENUM('OPEN', 'CLOSED', 'ACTIVE', 'INACTIVE') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org_category (category),
    INDEX idx_org_location (location),
    INDEX idx_org_status (status)
) ENGINE=InnoDB;

-- 3. Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_branch_org (organization_id)
) ENGINE=InnoDB;

-- 4. Services Table
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    token_prefix VARCHAR(10) NOT NULL DEFAULT 'Q',
    average_service_time INT NOT NULL DEFAULT 15 COMMENT 'in minutes',
    max_capacity INT NOT NULL DEFAULT 100,
    status ENUM('ACTIVE', 'INACTIVE', 'PAUSED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_service_org (organization_id),
    INDEX idx_service_status (status)
) ENGINE=InnoDB;

-- 5. Counters Table
CREATE TABLE IF NOT EXISTS counters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    service_id INT NOT NULL,
    staff_id INT NULL,
    counter_name VARCHAR(100) NOT NULL,
    status ENUM('OPEN', 'CLOSED', 'BUSY') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_counter_org (organization_id),
    INDEX idx_counter_service (service_id),
    INDEX idx_counter_staff (staff_id)
) ENGINE=InnoDB;

-- 6. Queue Tokens Table
CREATE TABLE IF NOT EXISTS queue_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_number VARCHAR(30) NOT NULL,
    sequence_num INT NOT NULL DEFAULT 1,
    token_date DATE NOT NULL,
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    service_id INT NOT NULL,
    counter_id INT NULL,
    status ENUM(
        'WAITING',
        'NEAR_TURN',
        'SERVING',
        'COMPLETED',
        'SKIPPED',
        'ON_HOLD',
        'CANCELLED'
    ) DEFAULT 'WAITING',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    notes VARCHAR(255) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (counter_id) REFERENCES counters(id) ON DELETE SET NULL,
    INDEX idx_token_date (token_date),
    INDEX idx_token_status (status),
    INDEX idx_token_service_status (service_id, status),
    INDEX idx_token_user (user_id)
) ENGINE=InnoDB;

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type ENUM(
        'QUEUE_JOINED',
        'TOKEN_APPROACHING',
        'TOKEN_CALLED',
        'QUEUE_COMPLETED',
        'QUEUE_CANCELLED',
        'ON_HOLD',
        'INFO'
    ) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_read (is_read)
) ENGINE=InnoDB;

-- 8. Queue History Table
CREATE TABLE IF NOT EXISTS queue_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_id INT NULL,
    token_number VARCHAR(30) NOT NULL,
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    service_id INT NOT NULL,
    counter_id INT NULL,
    status ENUM('COMPLETED', 'CANCELLED', 'SKIPPED') NOT NULL,
    joined_at TIMESTAMP NOT NULL,
    called_at TIMESTAMP NULL,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waiting_minutes INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_history_user (user_id),
    INDEX idx_history_org (organization_id),
    INDEX idx_history_date (completed_at)
) ENGINE=InnoDB;
