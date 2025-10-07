INSERT INTO colleges (code, name) VALUES
-- Engineering Colleges
('COE', 'College of Engineering'),
('CSM', 'College of Science and Mathematics'),
('CAS', 'College of Arts and Sciences'),
('CBA', 'College of Business Administration'),
('CED', 'College of Education'),
('CON', 'College of Nursing'),
('COM', 'College of Medicine'),
('COA', 'College of Architecture'),
('LAW', 'College of Law'),
('COF', 'College of Forestry'),
('COS', 'College of Social Sciences'),
('COPH', 'College of Public Health'),
('COD', 'College of Dentistry'),
('COP', 'College of Pharmacy'),
('COV', 'College of Veterinary Medicine'),
('MUS', 'College of Music'),
('FAA', 'College of Fine and Applied Arts'),
('JMC', 'College of Journalism and Mass Communication'),
('HUM', 'College of Humanities'),
('SS', 'College of Social Sciences'),
('ICT', 'College of Information and Communications Technology'),
('COGS', 'College of Graduate Studies'),
('COL', 'College of Law and Governance');

-- ============================================
-- PROGRAMS (45 programs)
-- ============================================
INSERT INTO programs (college_id, code, name) VALUES
-- College of Engineering (COE) programs
(1, 'BSCE', 'Bachelor of Science in Civil Engineering'),
(1, 'BSCpE', 'Bachelor of Science in Computer Engineering'),
(1, 'BSEE', 'Bachelor of Science in Electrical Engineering'),
(1, 'BSME', 'Bachelor of Science in Mechanical Engineering'),
(1, 'BSChE', 'Bachelor of Science in Chemical Engineering'),
(1, 'BSCS', 'Bachelor of Science in Computer Science'),

-- College of Science and Mathematics (CSM) programs
(2, 'BSBio', 'Bachelor of Science in Biology'),
(2, 'BSChem', 'Bachelor of Science in Chemistry'),
(2, 'BSMath', 'Bachelor of Science in Mathematics'),
(2, 'BSPhysics', 'Bachelor of Science in Physics'),
(2, 'BSStat', 'Bachelor of Science in Statistics'),

-- College of Arts and Sciences (CAS) programs
(3, 'BAPsych', 'Bachelor of Arts in Psychology'),
(3, 'BAComm', 'Bachelor of Arts in Communication'),
(3, 'BASocio', 'Bachelor of Arts in Sociology'),
(3, 'BAEnglish', 'Bachelor of Arts in English'),

-- College of Business Administration (CBA) programs
(4, 'BSBA-MKT', 'Bachelor of Science in Business Administration - Marketing'),
(4, 'BSBA-FIN', 'Bachelor of Science in Business Administration - Finance'),
(4, 'BSBA-HRM', 'Bachelor of Science in Business Administration - Human Resource Management'),
(4, 'BSA', 'Bachelor of Science in Accountancy'),
(4, 'BS-Entrep', 'Bachelor of Science in Entrepreneurship'),

-- College of Education (CED) programs
(5, 'BEEd', 'Bachelor of Elementary Education'),
(5, 'BSEd-English', 'Bachelor of Secondary Education - English'),
(5, 'BSEd-Math', 'Bachelor of Secondary Education - Mathematics'),
(5, 'BSEd-Science', 'Bachelor of Secondary Education - Science'),

-- College of Nursing (CON) programs
(6, 'BSN', 'Bachelor of Science in Nursing'),
(6, 'BS-Midwifery', 'Bachelor of Science in Midwifery'),

-- College of Medicine (COM) programs
(7, 'MD', 'Doctor of Medicine'),
(7, 'BS-MedicalTech', 'Bachelor of Science in Medical Technology'),

-- College of Architecture (COA) programs
(8, 'BSArch', 'Bachelor of Science in Architecture'),
(8, 'BS-ID', 'Bachelor of Science in Interior Design'),

-- College of Law (LAW) programs
(9, 'JD', 'Juris Doctor'),

-- College of Forestry (COF) programs
(10, 'BSF', 'Bachelor of Science in Forestry'),
(10, 'BS-EnvSci', 'Bachelor of Science in Environmental Science'),

-- College of Social Sciences (COS) programs
(11, 'BA-PolSci', 'Bachelor of Arts in Political Science'),
(11, 'BA-History', 'Bachelor of Arts in History'),

-- College of Public Health (COPH) programs
(12, 'BSPH', 'Bachelor of Science in Public Health'),

-- College of Dentistry (COD) programs
(13, 'DMD', 'Doctor of Dental Medicine'),

-- College of Pharmacy (COP) programs
(14, 'BSPharm', 'Bachelor of Science in Pharmacy'),

-- College of Veterinary Medicine (COV) programs
(15, 'DVM', 'Doctor of Veterinary Medicine'),

-- College of Music (MUS) programs
(16, 'BM-Music', 'Bachelor of Music'),
(16, 'BM-Performance', 'Bachelor of Music in Performance'),

-- College of Fine and Applied Arts (FAA) programs
(17, 'BFA-Visual', 'Bachelor of Fine Arts in Visual Arts'),
(17, 'BFA-Theater', 'Bachelor of Fine Arts in Theater Arts'),

-- College of Information and Communications Technology (ICT) programs
(21, 'BSIT', 'Bachelor of Science in Information Technology'),
(21, 'BSIS', 'Bachelor of Science in Information Systems');

-- ============================================
-- STUDENTS (117 students)
-- ============================================
INSERT INTO students (id, first_name, last_name, program_id, year_level, gender) VALUES
-- Computer Engineering Students (Year 1-5)
('2021-0001', 'Juan', 'Dela Cruz', 2, 4, 'Male'),
('2021-0002', 'Maria', 'Santos', 2, 4, 'Female'),
('2022-0001', 'Jose', 'Reyes', 2, 3, 'Male'),
('2022-0002', 'Ana', 'Gonzalez', 2, 3, 'Female'),
('2023-0001', 'Pedro', 'Lopez', 2, 2, 'Male'),
('2023-0002', 'Carmen', 'Torres', 2, 2, 'Female'),
('2024-0001', 'Miguel', 'Rivera', 2, 1, 'Male'),
('2024-0002', 'Isabel', 'Cruz', 2, 1, 'Female'),

-- Civil Engineering Students
('2020-0001', 'Antonio', 'Mendoza', 1, 5, 'Male'),
('2021-0003', 'Elena', 'Ramos', 1, 4, 'Female'),
('2022-0003', 'Carlos', 'Sy', 1, 3, 'Male'),
('2023-0003', 'Patricia', 'Chua', 1, 2, 'Female'),

-- Electrical Engineering Students
('2020-0002', 'Ricardo', 'Lim', 3, 5, 'Male'),
('2021-0004', 'Veronica', 'Tan', 3, 4, 'Female'),
('2022-0004', 'Fernando', 'Ong', 3, 3, 'Male'),

-- Mechanical Engineering Students
('2020-0003', 'Roberto', 'Wong', 4, 5, 'Male'),
('2021-0005', 'Sofia', 'Chan', 4, 4, 'Female'),
('2022-0005', 'Luis', 'Kwan', 4, 3, 'Male'),

-- Computer Science Students
('2021-0006', 'Gabriel', 'Lee', 6, 4, 'Male'),
('2022-0006', 'Catherine', 'Yu', 6, 3, 'Female'),
('2023-0004', 'Daniel', 'Chen', 6, 2, 'Male'),
('2024-0003', 'Andrea', 'Wang', 6, 1, 'Female'),

-- Biology Students
('2021-0007', 'Benjamin', 'Zhang', 7, 4, 'Male'),
('2022-0007', 'Natalie', 'Liu', 7, 3, 'Female'),
('2023-0005', 'Samuel', 'Zhao', 7, 2, 'Male'),

-- Chemistry Students
('2021-0008', 'Victor', 'Qian', 8, 4, 'Male'),
('2022-0008', 'Olivia', 'Sun', 8, 3, 'Female'),

-- Mathematics Students
('2021-0009', 'Eric', 'Li', 9, 4, 'Male'),
('2022-0009', 'Grace', 'Wu', 9, 3, 'Female'),

-- Psychology Students
('2021-0010', 'Andrew', 'Huang', 12, 4, 'Male'),
('2022-0010', 'Hannah', 'Lin', 12, 3, 'Female'),
('2023-0006', 'Jason', 'Zhou', 12, 2, 'Male'),
('2024-0004', 'Emily', 'Xu', 12, 1, 'Female'),

-- Business Administration - Marketing Students
('2021-0011', 'Jonathan', 'Ma', 16, 4, 'Male'),
('2022-0011', 'Jessica', 'Zhu', 16, 3, 'Female'),
('2023-0007', 'Kevin', 'Guo', 16, 2, 'Male'),

-- Business Administration - Finance Students
('2021-0012', 'Alexander', 'Cai', 17, 4, 'Male'),
('2022-0012', 'Victoria', 'Deng', 17, 3, 'Female'),

-- Accountancy Students
('2020-0004', 'Christopher', 'Hu', 19, 5, 'Male'),
('2021-0013', 'Samantha', 'Xie', 19, 4, 'Female'),
('2022-0013', 'Ryan', 'Liang', 19, 3, 'Male'),
('2023-0008', 'Megan', 'Fang', 19, 2, 'Female'),
('2024-0005', 'Justin', 'Mao', 19, 1, 'Male'),

-- Elementary Education Students
('2021-0014', 'Nicholas', 'Kang', 20, 4, 'Male'),
('2022-0014', 'Lauren', 'Shen', 20, 3, 'Female'),
('2023-0009', 'Aaron', 'Bai', 20, 2, 'Male'),

-- Nursing Students
('2020-0005', 'Patrick', 'Jin', 22, 5, 'Male'),
('2021-0015', 'Brittany', 'Luo', 22, 4, 'Female'),
('2022-0015', 'Derek', 'Yuan', 22, 3, 'Male'),
('2023-0010', 'Tiffany', 'Tang', 22, 2, 'Female'),
('2024-0006', 'Brian', 'Jiang', 22, 1, 'Male'),

-- Medical Technology Students
('2021-0016', 'Sean', 'Du', 23, 4, 'Male'),
('2022-0016', 'Rachel', 'Xia', 23, 3, 'Female'),

-- Architecture Students
('2020-0006', 'Matthew', 'Wei', 24, 5, 'Male'),
('2021-0017', 'Christina', 'Yin', 24, 4, 'Female'),
('2022-0017', 'Jordan', 'Han', 24, 3, 'Male'),

-- Law Students
('2020-0007', 'Brandon', 'Cheng', 26, 5, 'Male'),
('2021-0018', 'Amanda', 'Peng', 26, 4, 'Female'),
('2022-0018', 'Tyler', 'Ruan', 26, 3, 'Male'),

-- Forestry Students
('2021-0019', 'Zachary', 'Sheng', 27, 4, 'Male'),
('2022-0019', 'Vanessa', 'Fu', 27, 3, 'Female'),

-- Political Science Students
('2021-0020', 'Cody', 'Gao', 28, 4, 'Male'),
('2022-0020', 'Jasmine', 'Qi', 28, 3, 'Female'),

-- Public Health Students
('2021-0021', 'Austin', 'Kong', 29, 4, 'Male'),
('2022-0021', 'Stephanie', 'Cao', 29, 3, 'Female'),

-- Pharmacy Students
('2020-0008', 'Adam', 'Liao', 31, 5, 'Male'),
('2021-0022', 'Nicole', 'Shi', 31, 4, 'Female'),
('2022-0022', 'Logan', 'Yan', 31, 3, 'Male'),

-- Veterinary Medicine Students
('2020-0009', 'Ethan', 'Dong', 32, 5, 'Male'),
('2021-0023', 'Katherine', 'Zeng', 32, 4, 'Female'),

-- Music Students
('2021-0024', 'Nathan', 'Hao', 33, 4, 'Male'),
('2022-0023', 'Lily', 'Ye', 33, 3, 'Female'),

-- Visual Arts Students
('2021-0025', 'Caleb', 'Ge', 35, 4, 'Male'),
('2022-0024', 'Monica', 'Zhuang', 35, 3, 'Female'),

-- Information Technology Students
('2021-0026', 'Christian', 'Su', 36, 4, 'Male'),
('2022-0025', 'Paige', 'Shao', 36, 3, 'Female'),
('2023-0011', 'Marcus', 'Hua', 36, 2, 'Male'),
('2024-0007', 'Hailey', 'Chai', 36, 1, 'Female'),

-- Information Systems Students
('2020-0010', 'Dylan', 'Geng', 37, 5, 'Male'),
('2021-0027', 'Allison', 'Xiong', 37, 4, 'Female'),
('2022-0026', 'Cole', 'Xun', 37, 3, 'Male'),
('2023-0012', 'Molly', 'Zou', 37, 2, 'Female'),

-- Communication Students
('2021-0028', 'Isaiah', 'Wen', 13, 4, 'Male'),
('2022-0027', 'Kaitlyn', 'Meng', 13, 3, 'Female'),

-- Sociology Students
('2021-0029', 'Luke', 'Shen', 14, 4, 'Male'),
('2022-0028', 'Jenna', 'Rong', 14, 3, 'Female'),

-- English Students
('2021-0030', 'Gavin', 'Zang', 15, 4, 'Male'),
('2022-0029', 'Morgan', 'Qu', 15, 3, 'Female'),

-- HRM Students
('2021-0031', 'Mason', 'Shu', 18, 4, 'Male'),
('2022-0030', 'Brooke', 'Kuang', 18, 3, 'Female'),

-- Entrepreneurship Students
('2021-0032', 'Wyatt', 'Huang', 20, 4, 'Male'),
('2022-0031', 'Sydney', 'Cen', 20, 3, 'Female'),

-- Secondary Education - English Students
('2021-0033', 'Evan', 'Cen', 21, 4, 'Male'),
('2022-0032', 'Taylor', 'Shan', 21, 3, 'Female'),

-- Secondary Education - Math Students
('2021-0034', 'Aiden', 'Ning', 22, 4, 'Male'),
('2022-0033', 'Madison', 'Jia', 22, 3, 'Female'),

-- Secondary Education - Science Students
('2021-0035', 'Connor', 'Zhai', 23, 4, 'Male'),
('2022-0034', 'Alexis', 'Kou', 23, 3, 'Female'),

-- Midwifery Students
('2021-0036', 'Hunter', 'Gou', 24, 4, 'Male'),
('2022-0035', 'Julia', 'Wei', 24, 3, 'Female'),

-- Interior Design Students
('2021-0037', 'Adrian', 'Chu', 25, 4, 'Male'),
('2022-0036', 'Kylie', 'Yao', 25, 3, 'Female'),

-- Environmental Science Students
('2021-0038', 'Robert', 'Lai', 28, 4, 'Male'),
('2022-0037', 'Sabrina', 'Bi', 28, 3, 'Female'),

-- History Students
('2021-0039', 'Leonardo', 'Dai', 29, 4, 'Male'),
('2022-0038', 'Isabella', 'Tao', 29, 3, 'Female'),

-- Theater Arts Students
('2021-0040', 'Diego', 'Xuan', 36, 4, 'Male'),
('2022-0039', 'Gabriella', 'Leng', 36, 3, 'Female');