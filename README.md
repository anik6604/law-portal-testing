# TAMU Law Resume Portal

A secure, full-stack web application for Texas A&M University School of Law to assist with adjunct faculty hiring, resume management, and AI-powered candidate search.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [AI-Powered Search](#ai-powered-search)
- [Database Architecture](#database-architecture)
- [Vector Embeddings](#vector-embeddings)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)
- [License](#license)
- [Contact](#contact)

---

## Overview

The TAMU Law Resume Portal is a complete full-stack application that manages adjunct faculty applications with AI-powered candidate search capabilities. Built with React, Node.js, PostgreSQL, and OpenAI's GPT API, it provides intelligent resume analysis and semantic search functionality.

**Key Features:**
- Full-stack application with React frontend and Node.js backend
- PostgreSQL database with vector embeddings for semantic search
- AI-powered candidate matching using OpenAI GPT-4o-mini
- Automatic PDF text extraction from resumes
- Vector similarity search for scalable candidate matching
- Secure application submission with file uploads
- One-to-one email logic (latest submission per applicant)

---

## AI-Powered Search

### How It Works

The AI search uses a two-stage pipeline for optimal performance and accuracy:

#### Stage 1: Vector Similarity Search
- Query converted to 384-dimensional vector embedding
- PostgreSQL pgvector searches ALL resumes in database
- Returns top 50 most semantically similar candidates
- **Fast:** 3-5 seconds even with 500+ candidates

#### Stage 2: GPT-4o-mini Analysis
- Top 50 candidates sent to OpenAI GPT-4o-mini
- AI analyzes resume text for course-specific qualifications
- Returns candidates with:
  - **Fit level** (excellent/good/fair/marginal)
  - **Confidence score** (1-5)
  - **Detailed reasoning** for inclusion

### Semantic Understanding

The system understands meaning, not just keywords:

**Query:** "Cyber Law"

**Will Find:**
- "Data privacy attorney"
- "Cybersecurity compliance expert"
- "GDPR specialist"
- "Information security counsel"
- "Technology law practice"

**Won't Match:**
- "Tax law"
- "Real estate attorney"
- "Family law practice"

### Performance
- **Search 500 candidates:** 3-5 seconds
- **Search 1,000 candidates:** 4-6 seconds
- **No GPU required:** Runs on CPU
- **Scales to 10,000+** with proper indexing

---

## Database Architecture

### Tables

#### `applicants`
```sql
applicant_id    SERIAL PRIMARY KEY
name            VARCHAR(200) NOT NULL
email           VARCHAR(200) UNIQUE NOT NULL
phone           VARCHAR(50)
note            TEXT
created_at      TIMESTAMPTZ DEFAULT NOW()
```

#### `resumes`
```sql
resume_id           SERIAL PRIMARY KEY
applicant_id        INT REFERENCES applicants(applicant_id) ON DELETE CASCADE
resume_file         VARCHAR(500)
cover_letter_file   VARCHAR(500)
extracted_text      TEXT
embedding           vector(384)
uploaded_at         TIMESTAMPTZ DEFAULT NOW()
```

### Vector Index
```sql
CREATE INDEX resumes_embedding_idx 
  ON resumes USING ivfflat (embedding vector_cosine_ops);
```

### Relationships
- One-to-one: One applicant → One resume
- CASCADE delete: Deleting applicant removes resume
- Email uniqueness enforced at database level

---

## Vector Embeddings

### Technology Stack
- **pgvector:** PostgreSQL extension for vector operations
- **@xenova/transformers:** Local embedding generation
- **Model:** all-MiniLM-L6-v2 (384 dimensions)
- **No GPU required:** Runs on CPU efficiently

### Embedding Generation
Automatic on upload:
```javascript
PDF → Extract Text → Generate Embedding → Store in DB
```

For existing resumes:
```bash
node generate-embeddings.js
```

### Similarity Search
```sql
SELECT * FROM resumes
ORDER BY embedding <=> $queryEmbedding
LIMIT 50
```

Uses cosine similarity to find most relevant candidates.

---

## API Documentation

### POST /api/applications
Submit new application with file uploads.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `fullName` (required)
- `email` (required)
- `phone` (optional)
- `notes` (optional)
- `resume` (required, PDF file)
- `coverLetter` (optional, PDF file)

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "applicantId": 123,
  "resumeText": "Extracted text...",
  "embeddingGenerated": true
}
```

### GET /api/applications
Get all applications.

**Response:**
```json
{
  "success": true,
  "applications": [
    {
      "applicant_id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "resume_file": "john_resume.pdf",
      "extracted_text": "...",
      "created_at": "2025-10-10T..."
    }
  ]
}
```

### GET /api/applications/:id
Get single application by ID.

### POST /api/ai-search
Search for candidates by course/legal area.

**Request:**
```json
{
  "course": "Cyber Law",
  "description": "Optional additional context"
}
```

**Response:**
```json
{
  "success": true,
  "candidates": [
    {
      "id": 18,
      "name": "Bryan Byrd",
      "email": "bryan@example.com",
      "reasoning": "DoD info security law + taught cybersecurity",
      "fit": "excellent",
      "confidence": 5,
      "resumeFile": "bryan_resume.pdf"
    }
  ],
  "totalFound": 2,
  "searchedApplicants": 50,
  "course": "Cyber Law"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-10T..."
}
```

---

## Troubleshooting

### Port 5432 Already in Use
If you have PostgreSQL running locally:

1. Edit `docker-compose.yml`:
```yaml
ports:
  - "55432:5432"  # Changed from 5432:5432
```

2. Update `server/.env`:
```
DATABASE_URL=postgres://tamu:secret@localhost:55432/law_portal
```

3. Restart:
```bash
docker-compose down
docker-compose up -d
```

### Database Connection Refused
```bash
# Check Docker status
docker-compose ps
docker-compose logs db

# Restart if needed
docker-compose restart db
```

### "extension vector is not available"
Ensure you're using the pgvector image in `docker-compose.yml`:
```yaml
image: pgvector/pgvector:pg16
```

### Embedding Generation is Slow
First-time model download (~50MB) takes 30-60 seconds. Subsequent operations are fast.

### No Candidates Found
Check if resumes have embeddings:
```sql
docker-compose exec db psql -U tamu -d law_portal -c \
  "SELECT COUNT(*) FROM resumes WHERE embedding IS NOT NULL;"
```

Generate missing embeddings:
```bash
cd server
node generate-embeddings.js
```

### OpenAI API Errors
- **401:** Invalid API key in `.env`
- **429:** Rate limit exceeded, wait and retry
- **500:** Check server logs for details

### Reset Database (Delete All Data)
```bash
docker-compose down -v
docker-compose up -d
```

This recreates the database with fresh schema.tional adjunct application form with validation and file uploads.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Form Behavior](#form-behavior)
- [Planned Integrations](#planned-integrations)
- [Credits](#credits)
- [License](#license)
- [Contact](#contact)

---

## Overview
The TAMU Law Resume Portal provides a foundation for managing adjunct faculty applications.  
It is built with React and will later integrate with Texas A&M’s NetID system and an on-premise backend database for secure resume storage and AI-assisted querying.

**Current functionality:**
- Mock login screen that simulates authentication  
- Landing page with navigation tiles  
- Adjunct application submission form with validation and confirmation  

---

## Features

### Full Stack Application
- **Frontend:** React + Vite + React Router  
- **Backend:** Node.js + Express + PostgreSQL with pgvector
- **AI Integration:** OpenAI GPT-4o-mini for intelligent candidate matching
- **Vector Search:** Semantic search with 384-dimensional embeddings
- **PDF Processing:** Automatic text extraction from uploaded resumes
- **Deployment:** Docker Compose for database
- Clean CSS with TAMU maroon theme and Oswald typography

### Login Page
- Simulated "Login with NetID" button  
- Redirects to the main faculty portal

### Landing Page
- **AI Chatbot** - Intelligent candidate search by course name
- **Adjunct Application Portal** - Submit applications with resume uploads

### Adjunct Application Page
- **Required fields:** Full Name, Email, Resume (PDF)  
- **Optional fields:** Phone Number, Cover Letter, Comments/Notes
- **Database Integration:** Applications stored in PostgreSQL with automatic embedding generation
- **PDF Text Extraction:** Automatic extraction and storage for AI analysis
- **Phone input:**  
  - Accepts digits only  
  - Auto-formats to `xxx-xxx-xxxx`  
  - Strips country codes (`+1`, `001`) and extensions  
  - Enforces exactly 10 U.S. digits before allowing submission
- **One-to-one email logic:** Latest submission replaces previous applications
- Confirmation popup before submission  
- Inline success banner
- Transaction-based submission for data integrity

### AI Chatbot
- **Semantic Search:** Vector embeddings for intelligent matching
- **OpenAI Integration:** GPT-4o-mini analyzes candidate qualifications
- **Course-Based Search:** "Who can teach Cyber Law?" style queries
- **Fit & Confidence Scores:** Candidates rated by relevance and certainty
- **Fast Response:** 3-5 seconds even with 500+ candidates
- **Inclusive Matching:** Errs on the side of inclusion with clear reasoning
- **Context-Aware:** Considers applicant notes, referrals, and interests

### Form Validation
- Native HTML validation plus custom JavaScript enforcement
- File type validation (PDF only)
- 10MB file size limit per upload  

---

## Requirements
- **Node.js** v18 or later  
- **npm** v9 or later
- **Docker** and Docker Compose
- **OpenAI API Key** (for AI search functionality)
- Compatible with modern browsers: Chrome, Edge, Firefox, Safari
- Minimum 8GB RAM recommended for vector operations

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/FA25-CSCE482-capstone/github-setup-tamu-law.git
cd github-setup-tamu-law
```

### 2. Setup Environment Variables

**Frontend** (`frontend/.env`):
```bash
cd frontend
cp .env.example .env
# Edit .env and set:
VITE_API_URL=http://localhost:4000
```

**Server** (`server/.env`):
```bash
cd ../server
cp .env.example .env
# Edit .env and set:
DATABASE_URL=postgres://tamu:secret@localhost:5432/law_portal
PORT=4000
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start the Database (Docker)
```bash
# From project root
docker-compose up -d

# Verify it's running (should show "healthy")
docker-compose ps
```

### Quick start for teammates (reproduce DB with sample data)

If your teammates have the same `docker-compose.yml`, they can reproduce the exact database state used in this repo by using the SQL dump placed in `db/init/002_data.sql`.

1. Make sure the dump file is present in the repo (it should be at `db/init/002_data.sql`).
2. Remove any existing DB volume (this will delete local data):

```bash
docker-compose down -v
```

3. Start the stack. On first start the Postgres image will run all scripts in `db/init/` and initialize with the schema + data from `002_data.sql`:

```bash
docker-compose up -d
```

4. Verify DB is healthy and the data is present:

```bash
docker-compose exec db psql -U tamu -d law_portal -c "SELECT COUNT(*) FROM applicants;"
docker-compose exec db psql -U tamu -d law_portal -c "SELECT COUNT(*) FROM resumes;"
```

Notes:
- This approach requires a fresh DB volume because the docker-entrypoint-initdb.d scripts only run on first initialization. If you already have a database volume you want to keep, use the import method below instead.
- The dump includes extension creation for `vector` (pgvector). The Docker image used is `pgvector/pgvector:pg16`.

Alternative: import the dump manually into a running DB (no volume reset):

```bash
# from the project root after starting just the db container
docker-compose exec -T db psql -U tamu -d law_portal < resume_full_dump.sql
```


The database uses the **pgvector/pgvector:pg16** image with vector extensions enabled.

### 4. Install and Start Server
```bash
cd server
npm install
node src/index.js
```

Server will run on `http://localhost:4000`

**First-time setup:** The server will automatically download the embedding model (~50MB) on first run.

### 5. Install and Start Frontend
```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### 6. Generate Embeddings (If Existing Data)
If you have existing resumes without embeddings:
```bash
cd server
node generate-embeddings.js
```

### Quick Test
- Visit `http://localhost:4000/health` - Should show database connected
- Visit `http://localhost:5173` - Should show the login page
- Visit `http://localhost:5173/chatbot` - AI chatbot interface

## Project Structure
```plaintext
## Project Structure

```plaintext
frontend/
│
├── public/
│   ├── hero-banner.jpg
│   ├── tamu-law-wordmark.png
│   └── vite.svg
│
├── src/
│   │
│   ├── assets/
│   │   └── react.svg
│   │
│   ├── components/
│   │   ├── ChatBot.css
│   │   ├── ChatBot.jsx
│   │   ├── TileCard.jsx
│   │   └── TopBar.jsx
│   │
│   ├── pages/
│   │   ├── AdjunctApplicationPage.jsx
│   │   ├── LandingPage.jsx
│   │   └── LoginPage.jsx
│   │
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── theme.css
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md

```


---

## Usage
1. Run `npm run dev` and open [http://localhost:5173/](http://localhost:5173/)  
2. Click **Login with NetID** to enter the portal (mock login)  
3. Use the **Adjunct Application Portal** tile to access the form  
4. Fill in required fields and upload a PDF resume  
5. Confirm submission in the modal  
6. The form displays an inline success banner upon submission  

---

## Form Behavior

### Phone Input
- Normalizes away `+1`, `1`, spaces, parentheses, and extensions  
- Forces exactly 10 numeric digits  
- Automatically formats as `###-###-####`  

### File Uploads
- Accepts only `.pdf` files  
- Clears uploaded files after successful submission  

### Validation Flow
1. User completes form and clicks “Submit Application”  
2. Input validation occurs  
3. A confirmation modal appears  
4. Upon confirmation, form data is “submitted” (mock)  
5. Inline success banner is displayed  

---

## Planned Integrations

### NetID / Entra ID Authentication
- Future integration using Microsoft Entra ID (OIDC)  
- Will replace the mock login and restrict access to TAMU accounts  

### Backend and Database
- Planned backend: Node.js + Express + PostgreSQL/MySQL  
- Endpoint: `/api/applications` for storing submissions  
- Schema will include applicant data and file metadata  

### AI Resume Processing
- Future local AI service to extract structured data from PDF resumes  
- Enables search queries such as “Who can teach Cyber Law?”  

---

## Future Enhancements

### Planned Features
1. **S3 Integration** - Store PDFs in AWS S3 with signed URLs
2. **NetID Authentication** - Microsoft Entra ID (OIDC) integration
3. **Admin Dashboard** - View, search, and manage applications
4. **Advanced Filters** - Filter by experience, location, qualifications
5. **Conversation Memory** - AI remembers previous chat queries
6. **Batch Search** - Search for multiple courses simultaneously
7. **Export Results** - Download candidate lists as PDF/CSV
8. **Fine-tuned Model** - Train on law school hiring data
9. **Hybrid Search** - Combine vector search with SQL filters
10. **Multi-aspect Embeddings** - Separate vectors for skills, experience, education

---

## Technology Stack

### Frontend
- React 18
- Vite
- React Router
- CSS3 with TAMU branding

### Backend
- Node.js 18+
- Express.js
- Multer (file uploads)
- pdf-parse (text extraction)
- @xenova/transformers (embeddings)

### Database
- PostgreSQL 16
- pgvector extension
- Vector similarity search

### AI Services
- OpenAI GPT-4o-mini
- all-MiniLM-L6-v2 embedding model

### DevOps
- Docker & Docker Compose
- Git version control

---

## Credits

### Project Team
- **Ryan Mohammadian** – Schedule Coordinator  
- **Adeeb Momin** – Scope Coordinator  
- **Anik Momin** – Risk Coordinator & Lead Developer
- **Mitchell Good** – Stakeholder Management Coordinator  
- **Abhinav Devireddy** – Quality Coordinator  

### Faculty and Sponsors
- **Steven Vaughn** – Project Sponsor, Director of Graduate Programs (TAMU Law)  
- **Dr. Pauline Wade** – Course Instructor, Professor of Practice (CSCE)  
- **Brady Kincaid Testa** – Teaching Assistant (CSCE)

### Technologies
- **OpenAI** - GPT-4o-mini API
- **Hugging Face** - Transformer models
- **PostgreSQL** - pgvector extension
- **React** - Frontend framework
- **Node.js** - Backend runtime

---

## License
This project is licensed under the **MIT License**.

---

## Contact
For project information or future collaboration:

- **Anik Momin** – [anikmomin@tamu.edu](mailto:anikmomin@tamu.edu)
- **Mitchell Good** – [gm10073103@tamu.edu](mailto:gm10073103@tamu.edu)  
- **Adeeb Momin** – [adeeb_momin@tamu.edu](mailto:adeeb_momin@tamu.edu)  
- **Abhinav Devireddy** – [abhidev979@tamu.edu](mailto:abhidev979@tamu.edu)  
- **Ryan Mohammadian** – [ryanm64@tamu.edu](mailto:ryanm64@tamu.edu)
- **Steven Vaughn** – [steven.vaughn@law.tamu.edu](mailto:steven.vaughn@law.tamu.edu)  
- **Dr. Pauline Wade** – [paulinewade@tamu.edu](mailto:paulinewade@tamu.edu)  
- **Brady Kincaid Testa** – [btesta@tamu.edu](mailto:btesta@tamu.edu)

---

**Version:** 2.0  
**Last Updated:** October 11, 2025  
**Branch:** api-testing-openai  
**Status:** Production Ready  
