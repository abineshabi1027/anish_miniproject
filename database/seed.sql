-- ===================================================
-- QUEUELESS - SEED DATA FOR DEMONSTRATION
-- ===================================================

USE queueless_db;

-- 1. Insert Demo Users (admin123, staff123, user123)
-- Admin: admin@queueless.com / admin123
-- Staff: staff@queueless.com / staff123
-- Staff 2: doctor@queueless.com / staff123
-- Staff 3: banker@queueless.com / staff123
-- Customer: user@queueless.com / user123
-- Customer 2: anish@queueless.com / user123
-- Customer 3: priya@queueless.com / user123

INSERT INTO users (id, name, email, phone, password, role, status) VALUES
(1, 'System Administrator', 'admin@queueless.com', '+91 9876543210', '$2a$10$.Q.csQMUoKD4RkwovzDzYuCV/IU7mfaoKSVhOH/1vQ1Wou8THc4eC', 'ADMIN', 'ACTIVE'),
(2, 'Sarah Jenkins (Nurse/Staff)', 'staff@queueless.com', '+91 9876543211', '$2a$10$zZMN4WUorzCFaWmc59dwrucOaP0p6mgY26Rj/z3/dcCljVoRkQMmq', 'STAFF', 'ACTIVE'),
(3, 'Dr. Robert Miller', 'doctor@queueless.com', '+91 9876543212', '$2a$10$zZMN4WUorzCFaWmc59dwrucOaP0p6mgY26Rj/z3/dcCljVoRkQMmq', 'STAFF', 'ACTIVE'),
(4, 'David Brown (Bank Teller)', 'banker@queueless.com', '+91 9876543213', '$2a$10$zZMN4WUorzCFaWmc59dwrucOaP0p6mgY26Rj/z3/dcCljVoRkQMmq', 'STAFF', 'ACTIVE'),
(5, 'John Customer', 'user@queueless.com', '+91 9876543220', '$2a$10$C2JFEPraxrIgIiUy85ooq.AoDEpTu0sOyVVA3yl7hT5VJqvzev9QO', 'CUSTOMER', 'ACTIVE'),
(6, 'Anish Kumar', 'anish@queueless.com', '+91 9876543221', '$2a$10$C2JFEPraxrIgIiUy85ooq.AoDEpTu0sOyVVA3yl7hT5VJqvzev9QO', 'CUSTOMER', 'ACTIVE'),
(7, 'Priya Sharma', 'priya@queueless.com', '+91 9876543222', '$2a$10$C2JFEPraxrIgIiUy85ooq.AoDEpTu0sOyVVA3yl7hT5VJqvzev9QO', 'CUSTOMER', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Sample Organizations across multiple sectors
INSERT INTO organizations (id, name, category, address, location, phone, email, opening_time, closing_time, status) VALUES
(1, 'ABC City Hospital', 'Hospital', '124 Healthcare Avenue, Medical District', 'Pollachi', '+91 4259 234567', 'contact@abchospital.com', '08:00:00', '20:00:00', 'OPEN'),
(2, 'City National Bank', 'Bank', '45 Financial Plaza, Commercial Center', 'Coimbatore', '+91 422 2567890', 'support@citybank.com', '09:30:00', '16:30:00', 'OPEN'),
(3, 'Food Paradise Restaurant', 'Restaurant', '77 Gourmet Street, Downtown', 'Coimbatore', '+91 422 4321987', 'reservations@foodparadise.com', '11:00:00', '23:00:00', 'OPEN'),
(4, 'Regional Government Service Center', 'Government Office', 'Civil Station, District Collectorate Road', 'Pollachi', '+91 4259 221100', 'helpdesk@govservices.org', '09:00:00', '17:00:00', 'OPEN'),
(5, 'TechHub Device & Vehicle Service Center', 'Vehicle Service Center', 'Plot 18, Industrial Estate Phase 2', 'Coimbatore', '+91 422 8899001', 'service@techhub.com', '08:30:00', '19:00:00', 'OPEN'),
(6, 'Apex University Admissions & Student Affairs', 'College', 'Academic Block A, Green Valley Campus', 'Pollachi', '+91 4259 278899', 'admissions@apexuniv.edu', '09:00:00', '17:00:00', 'OPEN'),
(7, 'Glow & Style Luxury Salon', 'Salon', '5th Cross, Elite Boulevard', 'Coimbatore', '+91 422 7766554', 'appointments@glowandstyle.com', '10:00:00', '21:00:00', 'OPEN')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Insert Branches
INSERT INTO branches (id, organization_id, name, address, status) VALUES
(1, 1, 'Pollachi Central Campus', '124 Healthcare Avenue, Pollachi', 'ACTIVE'),
(2, 2, 'Main Commercial Branch', '45 Financial Plaza, Coimbatore', 'ACTIVE'),
(3, 4, 'Taluk Revenue & Aadhaar Center', 'Taluk Office Road, Pollachi', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Insert Services for Each Organization
INSERT INTO services (id, organization_id, name, token_prefix, average_service_time, max_capacity, status) VALUES
-- Hospital Services
(1, 1, 'General Consultation (OPD)', 'H', 15, 60, 'ACTIVE'),
(2, 1, 'Laboratory & Blood Tests', 'L', 10, 80, 'ACTIVE'),
(3, 1, 'Pharmacy & Drug Dispensation', 'P', 5, 120, 'ACTIVE'),
(4, 1, 'Cardiology Speciality', 'C', 20, 30, 'ACTIVE'),

-- Bank Services
(5, 2, 'Cash Deposits & Withdrawals', 'B', 8, 100, 'ACTIVE'),
(6, 2, 'New Account & KYC Verification', 'A', 20, 40, 'ACTIVE'),
(7, 2, 'Loan & Forex Advisory', 'LF', 25, 25, 'ACTIVE'),

-- Restaurant Services
(8, 3, 'Dining Table Waiting (2-4 Pax)', 'R', 30, 50, 'ACTIVE'),
(9, 3, 'Family / Party Table (6+ Pax)', 'RF', 45, 20, 'ACTIVE'),

-- Government Services
(10, 4, 'Aadhaar / ID Card Updates', 'G', 15, 75, 'ACTIVE'),
(11, 4, 'Revenue & Land Certificates', 'RC', 20, 50, 'ACTIVE'),

-- Vehicle / Tech Service
(12, 5, 'Quick Express Maintenance', 'V', 30, 40, 'ACTIVE'),
(13, 5, 'Comprehensive Diagnostic & Repair', 'VR', 60, 20, 'ACTIVE'),

-- College
(14, 6, 'Document Verification & Fee Clearance', 'COL', 15, 60, 'ACTIVE'),

-- Salon
(15, 7, 'Haircut & Styling', 'S', 25, 30, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5. Insert Counters
INSERT INTO counters (id, organization_id, service_id, staff_id, counter_name, status) VALUES
(1, 1, 1, 3, 'Doctor Chamber 1 (General)', 'OPEN'),
(2, 1, 1, 2, 'Doctor Chamber 2 (General)', 'OPEN'),
(3, 1, 2, NULL, 'Lab Counter 1 - Blood Draw', 'OPEN'),
(4, 1, 3, NULL, 'Pharmacy Window A', 'OPEN'),
(5, 2, 5, 4, 'Cash Counter 1', 'OPEN'),
(6, 2, 6, NULL, 'Customer Helpdesk 1', 'OPEN'),
(7, 4, 10, NULL, 'Aadhaar Enrollment Desk', 'OPEN')
ON DUPLICATE KEY UPDATE counter_name=VALUES(counter_name);

-- 6. Insert Initial Active Tokens for Demo
-- Let's put some realistic current tokens for today (CURDATE())
INSERT INTO queue_tokens (id, token_number, sequence_num, token_date, user_id, organization_id, service_id, counter_id, status, joined_at, called_at, completed_at) VALUES
(1, 'H-001', 1, CURDATE(), 6, 1, 1, 1, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 75 MINUTE), DATE_SUB(NOW(), INTERVAL 60 MINUTE), DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(2, 'H-002', 2, CURDATE(), 7, 1, 1, 1, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 60 MINUTE), DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
(3, 'H-003', 3, CURDATE(), 6, 1, 1, 1, 'SERVING',   DATE_SUB(NOW(), INTERVAL 40 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE), NULL),
(4, 'H-004', 4, CURDATE(), 7, 1, 1, NULL, 'NEAR_TURN', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NULL, NULL),
(5, 'H-005', 5, CURDATE(), 5, 1, 1, NULL, 'WAITING',   DATE_SUB(NOW(), INTERVAL 20 MINUTE), NULL, NULL),

-- Bank queue tokens
(6, 'B-001', 1, CURDATE(), 5, 2, 5, 5, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 90 MINUTE), DATE_SUB(NOW(), INTERVAL 80 MINUTE), DATE_SUB(NOW(), INTERVAL 70 MINUTE)),
(7, 'B-002', 2, CURDATE(), 6, 2, 5, 5, 'SERVING',   DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_SUB(NOW(), INTERVAL 5 MINUTE), NULL),
(8, 'B-003', 3, CURDATE(), 7, 2, 5, NULL, 'WAITING',   DATE_SUB(NOW(), INTERVAL 15 MINUTE), NULL, NULL)
ON DUPLICATE KEY UPDATE token_number=VALUES(token_number);

-- 7. Insert Notifications
INSERT INTO notifications (id, user_id, message, type, is_read, created_at) VALUES
(1, 5, 'Welcome to QueueLess! You are registered and ready to join virtual queues anytime.', 'INFO', TRUE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 5, 'You joined General Consultation queue at ABC City Hospital. Your token is H-005.', 'QUEUE_JOINED', FALSE, DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
(3, 7, 'Your turn is approaching! Token H-004 has only 1 person ahead at ABC City Hospital.', 'TOKEN_APPROACHING', FALSE, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(4, 6, 'Token H-003 is now being served at Doctor Chamber 1 (General)!', 'TOKEN_CALLED', TRUE, DATE_SUB(NOW(), INTERVAL 10 MINUTE))
ON DUPLICATE KEY UPDATE message=VALUES(message);

-- 8. Queue History for past analytics
INSERT INTO queue_history (id, token_id, token_number, user_id, organization_id, service_id, counter_id, status, joined_at, called_at, completed_at, waiting_minutes) VALUES
(1, 1, 'H-001', 6, 1, 1, 1, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 75 MINUTE), DATE_SUB(NOW(), INTERVAL 60 MINUTE), DATE_SUB(NOW(), INTERVAL 45 MINUTE), 15),
(2, 2, 'H-002', 7, 1, 1, 1, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 60 MINUTE), DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_SUB(NOW(), INTERVAL 25 MINUTE), 15),
(3, 6, 'B-001', 5, 2, 5, 5, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 90 MINUTE), DATE_SUB(NOW(), INTERVAL 80 MINUTE), DATE_SUB(NOW(), INTERVAL 70 MINUTE), 10),
(4, NULL, 'H-095', 5, 1, 1, 1, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 22),
(5, NULL, 'B-082', 6, 2, 5, 5, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 12),
(6, NULL, 'R-014', 7, 3, 8, NULL, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 28),
(7, NULL, 'G-040', 5, 4, 10, 7, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 18)
ON DUPLICATE KEY UPDATE token_number=VALUES(token_number);
