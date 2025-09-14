-- Create database
CREATE DATABASE heatmap_db;

\c heatmap_db;

-- Create buildings table
CREATE TABLE buildings (
    building_id VARCHAR(10) PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    building_capacity INT NOT NULL CHECK (building_capacity > 0)
);

INSERT INTO buildings (building_id, building_name, building_capacity) VALUES
('B1',  'Engineering Carpentry Shop', 25),
('B2',  'Engineering Workshop', 60),
('B3',  '', 100),
('B4',  'Generator Room', 10),
('B5',  '', 100),
('B6',  'Structure Lab', 50),
('B7',  'Administrative Building', 100),
('B8',  'Canteen', 30),
('B9',  'Lecture Room 10/11', 80),
('B10', 'Engineering Library', 120),
('B11', 'Department of Chemical and process Engineering', 80),
('B12', 'Security Unit', 20),
('B13', 'Drawing Office 2', 60),
('B14', 'Faculty Canteen', 30),
('B15', 'Department of Manufacturing and Industrial Engineering', 30),
('B16', 'Professor E.O.E. Perera Theater', 200),
('B17', 'Electronic Lab', 35),
('B18', 'Washrooms', 100),
('B19', 'Electrical and Electronic Workshop', 45),
('B20', 'Department of Computer Engineering', 30),
('B21', '', 50),
('B22', 'Environmental Lab', 30),
('B23', 'Applied Mechanics Lab', 30),
('B24', 'New Mechanics Lab', 35),
('B25', '', 50),
('B26', '', 50),
('B27', '', 50),
('B28', 'Materials Lab', 40),
('B29', 'Thermodynamics Lab', 40),
('B30', 'Fluids Lab', 50),
('B31', 'Surveying and Soil Lab', 70),
('B32', 'Department of Engineering Mathematics', 120),
('B33', 'Drawing Office 1', 50),
('B34', 'Department of Electrical and Electronic Engineering ', 150);

-- Create current_status table
CREATE TABLE current_status (
    building_id VARCHAR(10) NOT NULL PRIMARY KEY,
    current_crowd INT NOT NULL CHECK (current_crowd >= 0),
    color VARCHAR(20),
    status_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_building FOREIGN KEY (building_id)
        REFERENCES buildings(building_id)
        ON DELETE CASCADE
);

-- Create tables
CREATE TABLE zone (
    zone_id SERIAL PRIMARY KEY
);

CREATE TABLE location (
    location_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    x_coordinate FLOAT NOT NULL,
    y_coordinate FLOAT NOT NULL,
    min_x_coordinate FLOAT,
    max_x_coordinate FLOAT,
    min_y_coordinate FLOAT,
    max_y_coordinate FLOAT,
    zone_id INTEGER NOT NULL,
    FOREIGN KEY (zone_id) REFERENCES zone(zone_id)
);

CREATE TABLE booth (
    booth_id VARCHAR(10) PRIMARY KEY,
    category VARCHAR(50),
    location_id VARCHAR(10) NOT NULL,
    FOREIGN KEY (location_id) REFERENCES location(location_id)
);

CREATE TABLE amenity (
    amenity_id VARCHAR(10) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    location_id VARCHAR(10) NOT NULL,
    FOREIGN KEY (location_id) REFERENCES location(location_id)
);

CREATE TABLE emergency_point (
    point_id VARCHAR(10) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    location_id VARCHAR(10) NOT NULL,
    FOREIGN KEY (location_id) REFERENCES location(location_id)
);

CREATE TABLE session (
    session_id VARCHAR(10) PRIMARY KEY,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    booth_id VARCHAR(10) NOT NULL,
    FOREIGN KEY (booth_id) REFERENCES booth(booth_id)
);

CREATE TABLE app_user (
    user_id VARCHAR(10) PRIMARY KEY,
    device_type VARCHAR(30),
    x_coordinate FLOAT,
    y_coordinate FLOAT
);

CREATE TABLE bookmark (
    bookmark_id VARCHAR(10) PRIMARY KEY,
    session_id VARCHAR(10) NOT NULL,
    user_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT '2025-08-24 12:59:00+05:30',
    FOREIGN KEY (session_id) REFERENCES session(session_id),
    FOREIGN KEY (user_id) REFERENCES app_user(user_id)
);

CREATE TABLE route (
    route_id VARCHAR(10) PRIMARY KEY,
    user_id VARCHAR(10) NOT NULL,
    end_location_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT '2025-08-24 12:59:00+05:30',
    FOREIGN KEY (user_id) REFERENCES app_user(user_id),
    FOREIGN KEY (end_location_id) REFERENCES location(location_id)
);

-- Insert data in dependency order
-- 1. Zones
INSERT INTO zone (zone_id) VALUES
(1), (2), (3), (4), (5), (6);

-- 2. Locations
INSERT INTO location (location_id, name, x_coordinate, y_coordinate, min_x_coordinate, max_x_coordinate, min_y_coordinate, max_y_coordinate, zone_id) VALUES
('L1', 'B1: Engineering Hub', 228, 22, 196.62, 260.03, 13.28, 32.17, 2),
('L2', 'B2: Tech Innovation Center', 209, 60, 163.51, 254.83, 48, 73.53, 2),
('L3', 'B3: Mechanical Engineering Wing', 209, 92, 163.51, 254.83, 79.66, 104.17, 2),
('L4', 'B5: Computer Science Block', 250, 175, 233.45, 269.9, 119.66, 226.21, 4),
('L5', 'B8: Main Auditorium', 93, 92, 34.32, 151.43, 79.66, 104.17, 1),
('L6', 'B9: First Aid Station', 61, 118, 41.3, 81.47, 107.74, 128.17, 1),
('L7', 'B15: Innovation Gallery', 94, 251, 37.51, 151.42, 238.47, 264, 3),
('L8', 'B18: Energy & Environment Lab', 94, 304, 37.72, 151.42, 291.4, 316.93, 3),
('L9', 'B22: Biotech Research Wing', 205, 251, 157.04, 252.91, 238.47, 263.24, 4),
('L10', 'B27: Food Court & Washrooms', 210, 385, 157.05, 262.15, 372.94, 403.92, 5),
('L11', 'B28: Rest Area & Washrooms', 244, 422, 225.81, 262.15, 411.07, 433.2, 5),
('L12', 'Non-Interactive Building 1', 140.42, 61.96, 129.02, 151.42, 51.96, 73.92, 1),
('L13', 'Non-Interactive Building 2', 94.07, 193.81, 36.71, 151.43, 164.77, 211.07, 3),
('L14', 'Non-Interactive Building 3', 141.98, 224.94, 135.51, 148.45, 216.51, 233.37, 3),
('L15', 'Non-Interactive Building 4', 66.68, 144.95, 36.7, 96.36, 131.74, 157.95, 1),
('L16', 'Non-Interactive Building 5', 124.79, 144.95, 96.36, 151.42, 131.74, 157.95, 1),
('L17', 'Non-Interactive Building 6', 62.03, 277.7, 37.72, 86.36, 267.4, 288, 3),
('L18', 'Non-Interactive Building 7', 108.73, 277.7, 93.47, 125.56, 267.4, 288, 3),
('L19', 'Non-Interactive Building 8', 95.51, 374.72, 39.58, 151.43, 322.05, 424.6, 5),
('L20', 'Non-Interactive Building 9', 125.48, 395.66, 99.09, 151.43, 372.39, 424.6, 5),
('L21', 'Non-Interactive Building 10', 91.77, 408.66, 84.53, 103.55, 399.83, 417.53, 5),
('L22', 'Non-Interactive Building 11', 84.56, 376.64, 80.11, 89.13, 364.09, 389.28, 5),
('L23', 'Non-Interactive Building 12', 99.75, 326.46, 96.41, 102.75, 323.11, 329.45, 5),
('L24', 'Non-Interactive Building 13', 119.13, 326.28, 109.49, 128.77, 323.11, 329.45, 5),
('L25', 'Non-Interactive Building 14', 141.65, 117.83, 135.6, 147.69, 113.75, 121.92, 1),
('L26', 'Non-Interactive Building 15', 130.71, 114.83, 126.66, 134.58, 107.75, 121.92, 1),
('L27', 'Non-Interactive Building 16', 136.48, 171.77, 124.79, 148.96, 164.77, 178.05, 4),
('L28', 'Non-Interactive Building 17', 105.5, 118.17, 96.36, 114.99, 107.74, 128.17, 1),
('L29', 'Non-Interactive Building 18', 14.96, 116.37, 6.66, 23.26, 99.88, 132.86, 1),
('L30', 'Non-Interactive Building 19', 61.47, 64.24, 58.07, 65.73, 56.94, 74.56, 1),
('L31', 'Non-Interactive Building 20', 300.95, 255.38, 284.45, 317.9, 234.89, 276.76, 4),
('L32', 'Non-Interactive Building 21', 286.93, 316.66, 273.85, 291.85, 292.34, 333.32, 4),
('L33', 'Non-Interactive Building 22', 309.67, 323.47, 301.17, 319.17, 292.34, 354.94, 4),
('L34', 'Main Entry', 351.62, 467.31, NULL, NULL, NULL, NULL, 5),
('L35', 'Main Exit', 340.72, 491.82, NULL, NULL, NULL, NULL, 5),
('L36', 'Additional Exit', 6.66, 60.77, NULL, NULL, NULL, NULL, 1),
('L37', 'Emergency Point 1', 50, 100, NULL, NULL, NULL, NULL, 1),
('L38', 'Emergency Point 2', 200, 200, NULL, NULL, NULL, NULL, 4),
('L39', 'Emergency Point 3', 300, 350, NULL, NULL, NULL, NULL, 4),
('L40', 'Emergency Point 4', 150, 400, NULL, NULL, NULL, NULL, 5);

-- 3. Booths
INSERT INTO booth (booth_id, category, location_id) VALUES
('B1', 'Robotics', 'L1'),
('B2', 'IoT', 'L2'),
('B3', 'Mechanical Engineering', 'L3'),
('B4', 'Computer Science', 'L4'),
('B5', 'Auditorium Events', 'L5'),
('B6', 'Innovation Gallery', 'L7'),
('B7', 'Environmental Engineering', 'L8'),
('B8', 'Biotechnology', 'L9');

-- 4. Amenities
INSERT INTO amenity (amenity_id, type, location_id) VALUES
('A1', 'First Aid', 'L6'),
('A2', 'Food Court', 'L10'),
('A3', 'Washroom', 'L11'),
('A4', 'Rest Area', 'L11'),
('A5', 'Information Desk', 'L5');

-- 5. Emergency Points
INSERT INTO emergency_point (point_id, type, location_id) VALUES
('E1', 'Medical', 'L6'),
('E2', 'Fire Exit', 'L36'),
('E3', 'Emergency Assembly', 'L40'),
('E4', 'Fire Safety', 'L38'),
('E5', 'Security', 'L39');

-- 6. Users
INSERT INTO app_user (user_id, device_type, x_coordinate, y_coordinate) VALUES
('U1', 'Android', 351.62, 467.31),
('U2', 'iOS', 100, 100),
('U3', 'Android', 250, 300),
('U4', 'iOS', 50, 200),
('U5', 'Android', 300, 400);

-- 7. Sessions
INSERT INTO session (session_id, description, start_time, end_time, booth_id) VALUES
('S1', 'Robotics Showcase', '2025-08-24 09:00:00', '2025-08-24 10:30:00', 'B1'),
('S2', 'AI Innovation Lab', '2025-08-24 11:00:00', '2025-08-24 12:30:00', 'B1'),
('S3', 'IoT Demonstrations', '2025-08-24 10:00:00', '2025-08-24 11:30:00', 'B2'),
('S4', 'Smart City Solutions', '2025-08-24 14:00:00', '2025-08-24 15:30:00', 'B2'),
('S5', 'Coding Competition', '2025-08-24 09:30:00', '2025-08-24 11:00:00', 'B4'),
('S6', 'Opening Ceremony', '2025-08-24 08:00:00', '2025-08-24 09:30:00', 'B5'),
('S7', 'Student Projects', '2025-08-24 09:00:00', '2025-08-24 11:00:00', 'B6'),
('S8', 'Solar Power Demo', '2025-08-24 10:00:00', '2025-08-24 11:30:00', 'B7'),
('S9', 'Bioengineering Projects', '2025-08-24 09:30:00', '2025-08-24 11:00:00', 'B8');

-- 8. Bookmarks
INSERT INTO bookmark (bookmark_id, session_id, user_id, created_at) VALUES
('BM1', 'S1', 'U1', '2025-08-24 12:59:00+05:30'),
('BM2', 'S3', 'U2', '2025-08-24 12:59:00+05:30'),
('BM3', 'S5', 'U3', '2025-08-24 12:59:00+05:30'),
('BM4', 'S7', 'U4', '2025-08-24 12:59:00+05:30'),
('BM5', 'S9', 'U5', '2025-08-24 12:59:00+05:30');

-- 9. Routes
INSERT INTO route (route_id, user_id, end_location_id, created_at) VALUES
('R1', 'U1', 'L1', '2025-08-24 12:59:00+05:30'),
('R2', 'U2', 'L6', '2025-08-24 12:59:00+05:30'),
('R3', 'U3', 'L10', '2025-08-24 12:59:00+05:30'),
('R4', 'U4', 'L5', '2025-08-24 12:59:00+05:30'),
('R5', 'U5', 'L9', '2025-08-24 12:59:00+05:30');
