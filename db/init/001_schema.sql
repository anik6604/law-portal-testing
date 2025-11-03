CREATE TABLE IF NOT EXISTS applicants (
  applicant_id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  phone VARCHAR(50),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resumes (
  resume_id SERIAL PRIMARY KEY,
  applicant_id INT NOT NULL REFERENCES applicants(applicant_id) ON DELETE CASCADE,
  resume_file VARCHAR(500),
  cover_letter_file VARCHAR(500),
  extracted_text TEXT,
  embedding vector(384),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index for fast vector similarity search
CREATE INDEX IF NOT EXISTS resumes_embedding_idx 
  ON resumes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Chat history tables for centralized storage
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

-- Index for faster chat history queries
CREATE INDEX IF NOT EXISTS chat_sessions_created_at_idx ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id, created_at);
