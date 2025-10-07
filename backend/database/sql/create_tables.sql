-- Create colleges table
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_colleges_code ON colleges(code);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    college_id INTEGER,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    CONSTRAINT fk_programs_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);
CREATE INDEX IF NOT EXISTS idx_programs_college_id ON programs(college_id);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    program_id INTEGER,
    year_level INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    CONSTRAINT fk_students_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_program_id ON students(program_id);
CREATE INDEX IF NOT EXISTS idx_students_first_name ON students(first_name);
CREATE INDEX IF NOT EXISTS idx_students_last_name ON students(last_name);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);