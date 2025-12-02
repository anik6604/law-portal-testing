-- ============================================
-- TAMU Law Adjunct Hiring Portal - Database Schema
-- ============================================
-- This schema matches the production AWS RDS database
-- Last updated: December 2, 2025
-- PostgreSQL 16.8 with pgvector extension

-- Create pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- APPLICANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS applicants (
  applicant_id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  phone VARCHAR(50),
  note TEXT,
  hired BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) DEFAULT 'None' CHECK (role IN ('Faculty', 'Course Manager', 'None')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESUMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resumes (
  resume_id SERIAL PRIMARY KEY,
  applicant_id INT NOT NULL REFERENCES applicants(applicant_id) ON DELETE CASCADE,
  resume_file VARCHAR(500),          -- S3 URL
  cover_letter_file VARCHAR(500),    -- S3 URL
  extracted_text TEXT,               -- PDF text extraction
  embedding vector(384),             -- Semantic embedding (all-MiniLM-L6-v2)
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast vector similarity search
CREATE INDEX IF NOT EXISTS resumes_embedding_idx 
  ON resumes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- CHAT HISTORY TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  created_by_email VARCHAR(200) NOT NULL,
  created_by_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id SERIAL PRIMARY KEY,
  session_id INT NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster chat history queries
CREATE INDEX IF NOT EXISTS chat_sessions_created_at_idx ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id, created_at);

-- ============================================
-- COURSE CATALOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS course_catalog (
  course_id SERIAL PRIMARY KEY,
  course_code VARCHAR(20) UNIQUE NOT NULL,     -- e.g., "LAW 755"
  course_name VARCHAR(255) NOT NULL,           -- e.g., "Cyber Law"
  description TEXT NOT NULL,
  credits VARCHAR(20),                         -- e.g., "3", "2-3", "1-4"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for course search
CREATE INDEX IF NOT EXISTS idx_course_code ON course_catalog(course_code);
CREATE INDEX IF NOT EXISTS idx_course_name ON course_catalog(course_name);

-- ============================================
-- TRIGGERS
-- ============================================
-- Auto-update updated_at timestamp for course_catalog
CREATE OR REPLACE FUNCTION update_course_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_catalog_updated_at
    BEFORE UPDATE ON course_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_course_catalog_updated_at();
