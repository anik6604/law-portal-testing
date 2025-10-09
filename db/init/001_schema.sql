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
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
