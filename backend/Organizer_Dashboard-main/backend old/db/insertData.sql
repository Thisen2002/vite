-- ==============================
-- INSERT SAMPLE DATA
-- ==============================
\c organizer_dashboard;
-- Insert 4 Zones
INSERT INTO Zone (zone_name) VALUES
('A'),
('B'),
('C'),
('D');

-- Insert Buildings (each mapped to a zone)
INSERT INTO Building (zone_ID, building_name, description, exhibits) VALUES
(1, 'Engineering Hall', 'Main exhibition building for technology exhibits', ARRAY['Robotics', 'AI Showcase']),
(2, 'Science Center', 'Science experiments and research displays', ARRAY['Physics Lab', 'Chemistry Show']),
(3, 'Innovation Hub', 'Startups and entrepreneurship booths', ARRAY['Startup1', 'Startup2']),
(4, 'Cultural Pavilion', 'Arts, music, and cultural exhibits', ARRAY['Dance Exhibit', 'Music Stage']);

-- Insert Exhibits
INSERT INTO Exhibits (exhibit_name, building_ID) VALUES
('Robotics', 1),
('AI Showcase', 1),
('Physics Lab', 2),
('Chemistry Show', 2);

-- Insert Organizers
INSERT INTO Organizer (organizer_name, fname, lname, email, contact_no, password_hash, status) VALUES
('Tech Lead', 'Alice', 'Johnson', 'alice@example.com', '0771234567', 'hashed_pw1', 'approved'),
('Science Head', 'Bob', 'Smith', 'bob@example.com', '0772345678', 'hashed_pw2', 'pending'),
('Innovation Lead', 'Carol', 'Brown', 'carol@example.com', '0773456789', 'hashed_pw3', 'approved'),
('Culture Lead', 'David', 'Lee', 'david@example.com', '0774567890', 'hashed_pw4', 'pending');

-- Insert Events
INSERT INTO Events (event_name, start_time, end_time, location, description, media_urls, event_categories) VALUES
('Robotics Workshop', '2025-09-15 10:00:00', '2025-09-15 12:00:00', 'Engineering Hall', 'Hands-on robotics session', 'url1', ARRAY['Workshop', 'Tech']),
('AI Talk', '2025-09-16 14:00:00', '2025-09-16 15:30:00', 'Engineering Hall', 'Discussion on AI trends', 'url2', ARRAY['Seminar', 'AI']),
('Physics Demo', '2025-09-17 09:00:00', '2025-09-17 11:00:00', 'Science Center', 'Live physics experiments', 'url3', ARRAY['Demo', 'Science']),
('Cultural Show', '2025-09-18 18:00:00', '2025-09-18 20:00:00', 'Cultural Pavilion', 'Dance and music performance', 'url4', ARRAY['Show', 'Culture']);

-- Insert Admins
INSERT INTO Admin (user_name, email) VALUES
('admin1', 'admin1@example.com'),
('admin2', 'admin2@example.com'),
('admin3', 'admin3@example.com'),
('admin4', 'admin4@example.com');

-- Insert Speakers
INSERT INTO Speaker (speaker_name, email) VALUES
('Prof. Xavier', 'xavier@example.com'),
('Dr. Strange', 'strange@example.com'),
('Ms. Marvel', 'marvel@example.com'),
('Mr. Stark', 'stark@example.com');

-- Link Events with Speakers
INSERT INTO Event_Speaker (event_ID, speaker_ID) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

-- Insert Tags
INSERT INTO Tag (tag_name) VALUES
('Technology'),
('Science'),
('Innovation'),
('Culture');

-- Link Events with Tags
INSERT INTO Event_Tag (event_ID, tag_ID) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 4);
