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

