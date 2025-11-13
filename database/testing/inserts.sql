/*
inserts.sql
-----------
This file contains SQL insert statements for testing purposes.
*/

INSERT INTO COMPANY (COMP_NAME, COMP_DESC) VALUES
('Test Company 1', 'This is a test company for software development. Nr.1'),
('Test Company 2', 'This is a test company for software development. Nr.2'),
('Test Company 3', 'This is a test company for software development. Nr.3'),
('Test Company 4', 'This is a test company for software development. Nr.4'),
('Test Company 5', 'This is a test company for software development. Nr.5'),
('Test Company 6', 'This is a test company for software development. Nr.6'),
('Test Company 7', 'This is a test company for software development. Nr.7'),
('Test Company 8', 'This is a test company for software development. Nr.8'),
('Test Company 9', 'This is a test company for software development. Nr.9'),
('Test Company 10', 'This is a test company for software development. Nr.10'),
('Test Company 11', 'This is a test company for software development. Nr.11'),
('Test Company 12', 'This is a test company for software development. Nr.12'),
('Test Company 13', 'This is a test company for software development. Nr.13'),
('Test Company 14', 'This is a test company for software development. Nr.14'),
('Test Company 15', 'This is a test company for software development. Nr.15');



INSERT INTO USERS (COMP_ID, USER_ABBR, USER_SURNAME, USER_FIRST_NAME, USER_ROLE, USER_PASSWORD) VALUES
(1, 'SMJ', 'Smith', 'John', 'System Admin', 'password123'),
(1, 'MIJ', 'Miller', 'Jane', 'Software Engineer', 'password123'),
(2, 'JOM', 'Johnson', 'Michael', 'Database Admin', 'password123'),
(2, 'DAE', 'Davis', 'Emily', 'Software Engineer', 'password123'),
(3, 'BRW', 'Brown', 'William', 'System Admin', 'password123'),
(3, 'WIO', 'Wilson', 'Olivia', 'Software Engineer', 'password123'),
(4, 'TAJ', 'Taylor', 'James', 'Cloud Admin', 'password123'),
(4, 'ANS', 'Anderson', 'Sophia', 'Software Engineer', 'password123'),
(5, 'THB', 'Thomas', 'Benjamin', 'Network Admin', 'password123'),
(5, 'JAA', 'Jackson', 'Ava', 'Software Engineer', 'password123'),
(6, 'WHD', 'White', 'Daniel', 'Security Admin', 'password123'),
(6, 'HAM', 'Harris', 'Mia', 'Software Engineer', 'password123'),
(7, 'MAM', 'Martin', 'Matthew', 'DevOps Engineer', 'password123'),
(7, 'THI', 'Thompson', 'Isabella', 'Software Engineer', 'password123'),
(8, 'GAJ', 'Garcia', 'Joseph', 'System Admin', 'password123'),
(8, 'MAC', 'Martinez', 'Charlotte', 'Software Engineer', 'password123'),
(9, 'ROD', 'Robinson', 'David', 'Database Admin', 'password123'),
(9, 'CLA', 'Clark', 'Amelia', 'Software Engineer', 'password123'),
(10, 'ROA', 'Rodriguez', 'Andrew', 'Applications Admin', 'password123'),
(10, 'LEG', 'Lewis', 'Grace', 'Software Engineer', 'password123'),
(11, 'LEC', 'Lee', 'Christopher', 'Support Admin', 'password123'),
(11, 'WAL', 'Walker', 'Lily', 'Software Engineer', 'password123'),
(12, 'HAA', 'Hall', 'Alexander', 'Network Admin', 'password123'),
(12, 'YOE', 'Young', 'Ella', 'Software Engineer', 'password123'),
(13, 'KIS', 'King', 'Samuel', 'IT Manager', 'password123'),
(13, 'WRC', 'Wright', 'Chloe', 'Software Engineer', 'password123'),
(14, 'SCH', 'Scott', 'Henry', 'System Admin', 'password123'),
(14, 'GRA', 'Green', 'Abigail', 'Software Engineer', 'password123'),
(15, 'ADL', 'Adams', 'Lucas', 'Cloud Admin', 'password123'),
(15, 'BAH', 'Baker', 'Harper', 'Software Engineer', 'password123');



INSERT INTO ASSET_MGMT (USER_CR_ID, COMP_ID) VALUES 
(1, 1),
(2, 1),
(3, 2),
(1, 3),
(2, 2),
(3, 3);
