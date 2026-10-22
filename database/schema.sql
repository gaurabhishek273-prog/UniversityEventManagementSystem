-- University Event Management System (UEMS) Database Schema
-- Based on the provided ER diagram relationships

-- Create database
CREATE DATABASE IF NOT EXISTS uems;
USE uems;

-- 1. Faculty table
CREATE TABLE Faculty (
    Faculty_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Venue table
CREATE TABLE Venue (
    Venue_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    capacity INT,
    facilities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BudgetCategory table
CREATE TABLE BudgetCategory (
    Category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. DiscountScheme table
CREATE TABLE DiscountScheme (
    Scheme_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    discount_percentage DECIMAL(5,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. User table
CREATE TABLE User (
    User_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('student', 'faculty', 'staff') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Event table (references Faculty and Venue)
CREATE TABLE Event (
    Event_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('planned', 'ongoing', 'completed', 'cancelled') DEFAULT 'planned',
    Faculty_id INT NOT NULL,
    Venue_id INT NOT NULL,
    Scheme_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Faculty_id) REFERENCES Faculty(Faculty_id),
    FOREIGN KEY (Venue_id) REFERENCES Venue(Venue_id),
    FOREIGN KEY (Scheme_id) REFERENCES DiscountScheme(Scheme_id)
);

-- 7. SubEvent table (references Event)
CREATE TABLE SubEvent (
    SubEvent_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(200),
    Event_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Event_id) REFERENCES Event(Event_id) ON DELETE CASCADE
);

-- 8. Budget table (references Event and BudgetCategory)
CREATE TABLE Budget (
    Budget_id INT PRIMARY KEY AUTO_INCREMENT,
    allocated_amount DECIMAL(10,2) NOT NULL,
    spent_amount DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    Event_id INT NOT NULL,
    Category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Event_id) REFERENCES Event(Event_id) ON DELETE CASCADE,
    FOREIGN KEY (Category_id) REFERENCES BudgetCategory(Category_id)
);

-- 9. Sponsor table (references Event)
CREATE TABLE Sponsor (
    Sponsor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    contribution_amount DECIMAL(10,2),
    Event_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Event_id) REFERENCES Event(Event_id) ON DELETE CASCADE
);

-- 10. Committee table (references Event)
CREATE TABLE Committee (
    Committee_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    Event_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Event_id) REFERENCES Event(Event_id) ON DELETE CASCADE
);

-- 11. Member table (references Committee and User)
CREATE TABLE Member (
    Member_id INT PRIMARY KEY AUTO_INCREMENT,
    role VARCHAR(50),
    responsibilities TEXT,
    Committee_id INT NOT NULL,
    User_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Committee_id) REFERENCES Committee(Committee_id) ON DELETE CASCADE,
    FOREIGN KEY (User_id) REFERENCES User(User_id)
);

-- 12. Registration table (Many-to-Many: User and Event)
CREATE TABLE Registration (
    Registration_id INT PRIMARY KEY AUTO_INCREMENT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('registered', 'attended', 'cancelled') DEFAULT 'registered',
    User_id INT NOT NULL,
    Event_id INT NOT NULL,
    FOREIGN KEY (User_id) REFERENCES User(User_id),
    FOREIGN KEY (Event_id) REFERENCES Event(Event_id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (User_id, Event_id)
);

-- 13. Feedback table (Many-to-Many: User and Event)
CREATE TABLE Feedback (
    Feedback_id INT PRIMARY KEY AUTO_INCREMENT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    User_id INT NOT NULL,
    Event_id INT NOT NULL,
    FOREIGN KEY (User_id) REFERENCES User(User_id),
    FOREIGN KEY (Event_id) REFERENCES Event(Event_id) ON DELETE CASCADE,
    UNIQUE KEY unique_feedback (User_id, Event_id)
);

-- Insert sample data
INSERT INTO Faculty (name, email, password, department, phone) VALUES
('Dr. John Smith', 'faculty@uems.edu', 'faculty123', 'Computer Science', '123-456-7890'),
('Dr. Jane Doe', 'admin@uems.edu', 'admin123', 'Administration', '123-456-7891');

INSERT INTO User (name, email, password, phone, role) VALUES
('Student User', 'student@uems.edu', 'student123', '123-456-7892', 'student'),
('Staff User', 'staff@uems.edu', 'staff123', '123-456-7893', 'staff');

INSERT INTO Venue (name, location, capacity, facilities) VALUES
('Main Auditorium', 'Building A, Floor 1', 500, 'Projector, Sound System, AC'),
('Conference Hall', 'Building B, Floor 2', 100, 'Projector, Whiteboard'),
('Sports Ground', 'Campus Ground', 1000, 'Open Area, Lighting');

INSERT INTO BudgetCategory (name, description) VALUES
('Venue', 'Venue booking and setup costs'),
('Catering', 'Food and beverage expenses'),
('Equipment', 'Audio/Visual and other equipment'),
('Marketing', 'Promotion and advertising costs');

INSERT INTO DiscountScheme (name, discount_percentage, description) VALUES
('Student Discount', 20.00, 'Special discount for students'),
('Early Bird', 15.00, 'Early registration discount'),
('Group Discount', 25.00, 'Discount for group registrations');