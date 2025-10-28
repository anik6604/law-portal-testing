# TAMU## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [AWS Infrastructure](#aws-infrastructure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [AI-Powered Search](#ai-powered-search)
- [Database Architecture](#database-architecture)
- [Vector Embeddings](#vector-embeddings)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)
- [License](#license)
- [Contact](#contact)tal

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

The TAMU Law Resume Portal is a production-ready full-stack application that manages adjunct faculty applications with AI-powered candidate search capabilities. Built with React, Node.js, AWS RDS PostgreSQL, S3, and OpenAI's GPT API, it provides intelligent resume analysis and semantic search functionality with enterprise-grade cloud infrastructure.

**Key Features:**
- Full-stack application with React frontend and Node.js backend
- **AWS RDS PostgreSQL** with KMS encryption and pgvector for semantic search
- **AWS S3** for secure resume storage with pre-signed URLs (7-day expiration)
- AI-powered candidate matching using OpenAI GPT-4o-mini with strict confidence scoring
- Automatic PDF text extraction and embedding generation
- Vector similarity search for scalable candidate matching
- Secure application submission with direct S3 uploads
- One-to-one email logic (latest submission per applicant)
- **Production-ready AWS infrastructure** with encryption at rest and in transit
- Beautiful UI with TAMU Law building background imagery

---

## AWS Infrastructure

### Production Cloud Architecture

The application is deployed with enterprise-grade AWS infrastructure:

#### AWS RDS PostgreSQL 16.8
- **Instance:** `lawrdsstack-lawpostgres-enc`
- **Encryption:** AWS KMS encryption at rest
- **Region:** us-east-1
- **Instance Class:** db.t3.micro
- **Storage:** Encrypted with AWS-managed KMS key
- **SSL/TLS:** Enabled for encryption in transit
- **Public Access:** Enabled with security group restrictions
- **Extensions:** pgvector v0.8.0 for semantic search
- **Backups:** Automated snapshots enabled

#### AWS S3 Storage
- **Bucket:** `resume-storage-tamu-law`
- **Region:** us-east-2
- **Encryption:** SSE-S3 (server-side encryption)
- **Access:** Private bucket with pre-signed URLs
- **Pre-signed URL Expiration:** 7 days (604,800 seconds)
- **Public Access:** Blocked (all public access blocks enabled)
- **Storage:** 97+ resume PDFs with organized naming

#### Infrastructure as Code
- **AWS CDK:** TypeScript infrastructure definitions
- **Stack:** `LawRdsStack` for RDS provisioning
- **Version Control:** All IaC in `infra/` directory
- **Automated:** Database initialization scripts

#### Security Features
- **Encryption at Rest:** KMS-encrypted RDS storage
- **Encryption in Transit:** SSL/TLS for all database connections
- **Private S3:** No public access, signed URLs only
- **Security Groups:** Configured for controlled access
- **Secrets Management:** Environment variables for credentials
- **Network Security:** VPC with subnet groups

### Migration from Local to AWS
The application successfully migrated from local Docker PostgreSQL to fully managed AWS infrastructure:
- ✅ Data migrated via encrypted snapshots
- ✅ 97 resume files uploaded to S3
- ✅ Database URLs updated to S3 paths
- ✅ Pre-signed URL generation implemented
- ✅ Zero data loss during migration

---

## Features

### How It Works

The AI search uses a two-stage pipeline for optimal performance and accuracy:

#### Stage 1: Vector Similarity Search
- Query converted to 384-dimensional vector embedding
- AWS RDS PostgreSQL pgvector searches ALL resumes in database
- Returns top 200 most semantically similar candidates (configurable)
- **Fast:** 3-5 seconds even with 500+ candidates
- Cosine similarity distance operator for relevance ranking

#### Stage 2: GPT-4o-mini Batch Analysis
- Top 200 candidates divided into batches of 15
- Concurrent batch processing for optimal performance
- AI analyzes resume text for course-specific qualifications
- Strict confidence scoring with direct experience requirements
- Returns candidates with:
  - **Confidence score** (1-5, only 4+ shown to users)
  - **Detailed reasoning** (max 120 characters)
  - **Pre-signed S3 resume URL** (7-day expiration)
  - **Applicant metadata** (name, email, notes)

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
- **Search 200 candidates:** 3-5 seconds
- **Search 500 candidates:** 4-6 seconds
- **Search 1,000 candidates:** 5-8 seconds
- **No GPU required:** Runs on CPU with @xenova/transformers
- **Scales to 10,000+** with proper IVFFlat indexing
- **Batch concurrency:** Processes multiple batches in parallel
- **AWS RDS:** Managed database with automatic scaling

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
resume_file         VARCHAR(500)  -- S3 URL format
cover_letter_file   VARCHAR(500)  -- S3 URL format
extracted_text      TEXT
embedding           vector(384)
uploaded_at         TIMESTAMPTZ DEFAULT NOW()
```

**Example S3 URL:** `https://resume-storage-tamu-law.s3.us-east-2.amazonaws.com/john_doe_resume.pdf`

### Vector Index
```sql
CREATE INDEX resumes_embedding_idx 
  ON resumes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Performance Note:** IVFFlat index provides fast approximate nearest neighbor search for 1000+ candidates.

### AWS Infrastructure
- **RDS Connection:** SSL/TLS encryption with `sslmode=no-verify` for AWS RDS self-signed certificates
- **Connection Pooling:** pg.Pool for efficient database connection management
- **S3 Integration:** Direct file uploads with AWS SDK v3
- **Pre-signed URLs:** Temporary 7-day access links generated on-demand

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
PDF → Extract Text → Generate Embedding → Upload to S3 → Store URL & Embedding in RDS
```

For existing resumes (if needed):
```bash
node generate-embeddings.js
```

**AWS Integration:**
- Files uploaded directly to S3 using AWS SDK v3
- S3 URLs stored in database (`resume_file`, `cover_letter_file`)
- Pre-signed URLs generated on-demand for secure access
- 7-day expiration (604,800 seconds, maximum for SigV4)

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

## Security Features

### Data Encryption
- **At Rest:** AWS KMS encryption for RDS storage
- **In Transit:** SSL/TLS for all database connections
- **S3 Encryption:** Server-side encryption (SSE-S3)
- **No Public Access:** S3 bucket has all public access blocks enabled

### Access Control
- **Pre-signed URLs:** Temporary 7-day access to resume files
- **Private S3 Bucket:** No direct public access allowed
- **Security Groups:** Network-level access control for RDS
- **Environment Variables:** Credentials never committed to repository
- **`.gitignore`:** Comprehensive exclusions for sensitive data

### Infrastructure Security
- **VPC Isolation:** RDS deployed in private subnet group
- **Managed Secrets:** AWS Secrets Manager integration available
- **Automated Backups:** Point-in-time recovery enabled
- **Patch Management:** AWS handles security patches
- **Monitoring:** CloudWatch integration for anomaly detection

### Application Security
- **Input Validation:** Client and server-side validation
- **File Type Restrictions:** PDF-only uploads enforced
- **File Size Limits:** 10MB maximum per file
- **SQL Injection Prevention:** Parameterized queries with pg library
- **CORS Configuration:** Restricted origins in production
- **Transaction Safety:** Database transactions for data integrity

### Best Practices Implemented
- Separate `.env` files for different environments
- `.env.example` templates with placeholders (no secrets)
- AWS credentials excluded from version control
- Database dumps excluded from repository (`.sql` files ignored)
- Automated snapshot encryption for data migration
- Regular dependency updates for security patches

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
- **Frontend:** React + Vite + React Router with TAMU Law building background
- **Backend:** Node.js + Express + AWS RDS PostgreSQL with pgvector
- **Cloud Storage:** AWS S3 for resume files with pre-signed URLs
- **AI Integration:** OpenAI GPT-4o-mini for intelligent candidate matching
- **Vector Search:** Semantic search with 384-dimensional embeddings
- **PDF Processing:** Automatic text extraction from uploaded resumes
- **Infrastructure:** AWS CDK for infrastructure as code
- **Deployment:** Docker Compose for local development, AWS for production
- Clean CSS with TAMU maroon theme, Oswald typography, and law school imagery

### Login Page
- Simulated "Login with NetID" button  
- Redirects to the main faculty portal
- Beautiful law school building background image
- Semi-transparent card design for modern aesthetics

### Landing Page
- **AI Chatbot** - Intelligent candidate search by course name with clickable resume links
- **Adjunct Application Portal** - Submit applications with resume uploads
- Law school building background with parallax effect
- Responsive design with semi-transparent content cards

### Adjunct Application Page
- **Required fields:** Full Name, Email, Resume (PDF)  
- **Optional fields:** Phone Number, Cover Letter, Comments/Notes
- **AWS Integration:** 
  - Automatic upload to S3 bucket
  - Storage of S3 URLs in encrypted RDS database
  - Pre-signed URL generation for secure downloads
- **PDF Text Extraction:** Automatic extraction and storage for AI analysis
- **Embedding Generation:** Automatic 384-dimensional vector creation
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
- **Strict Confidence Scoring System:**
  - **Level 5:** Rare, explicit topical match with extensive direct experience (e.g., "practiced cybersecurity law for 10+ years")
  - **Level 4:** Clear direct experience in specific topic (e.g., "taught cyber law course" or "cybersecurity attorney")
  - **Level 3:** Indirect/transferable experience (e.g., "data privacy attorney" for cyber law)
  - **Level 2:** Weak/tangential connection
  - **Level 1:** Minimal to no correlation
- **Confidence Filter:** Only shows candidates with confidence >= 4 (direct experience required)
- **Batch Processing:** Processes 15 candidates per batch for optimal performance
- **Fast Response:** 3-5 seconds even with 200+ candidates
- **Clickable Resume Links:** Markdown-rendered links to S3 pre-signed URLs (7-day expiration)
- **Context-Aware:** Considers applicant notes, referrals, and interests
- Opens resumes in new tab with proper security attributes

---

## AI-Powered Search

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
DATABASE_URL=postgresql://username:password@your-rds-endpoint.amazonaws.com:5432/law_portal?ssl=true&sslmode=no-verify
PORT=4000
OPENAI_API_KEY=your_openai_api_key_here
AWS_REGION=us-east-2
S3_BUCKET_NAME=your-s3-bucket-name
SEARCH_LIMIT=200
```

**AWS Credentials** (for S3 access):
```bash
# Configure AWS CLI credentials (if not already done)
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-2
# Default output format: json
```

**Note:** The application uses AWS SDK v3 which automatically reads credentials from `~/.aws/credentials`

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

### Completed Features ✅
1. ✅ **S3 Integration** - PDFs stored in AWS S3 with 7-day pre-signed URLs
2. ✅ **AWS RDS Database** - Encrypted PostgreSQL with pgvector
3. ✅ **Clickable Resume Links** - Markdown-rendered links in chatbot
4. ✅ **Strict Confidence Scoring** - Direct experience required (4+)
5. ✅ **Batch Processing** - Concurrent AI analysis for better performance
6. ✅ **Infrastructure as Code** - AWS CDK for reproducible deployments

### Planned Features 🚀
1. **NetID Authentication** - Microsoft Entra ID (OIDC) integration
2. **Admin Dashboard** - View, search, and manage applications with filters
3. **Advanced Filters** - Filter by experience, location, qualifications
4. **Conversation Memory** - AI remembers previous chat queries in session
5. **Batch Search** - Search for multiple courses simultaneously
6. **Export Results** - Download candidate lists as PDF/CSV
7. **Email Notifications** - Automated emails for application submissions
8. **Fine-tuned Model** - Train on law school hiring data for better matching
9. **Hybrid Search** - Combine vector search with SQL filters (experience years, location)
10. **Multi-aspect Embeddings** - Separate vectors for skills, experience, education
11. **CloudFront CDN** - Faster resume delivery with edge caching
12. **Lambda Functions** - Serverless PDF processing and embedding generation
13. **DynamoDB Integration** - Chat history and user sessions
14. **API Gateway** - RESTful API with rate limiting and authentication

---

## Technology Stack

### Frontend
- React 18
- Vite
- React Router
- react-markdown (for clickable links)
- CSS3 with TAMU branding and law school imagery

### Backend
- Node.js 18+
- Express.js
- Multer (file uploads)
- pdf-parse (text extraction)
- @xenova/transformers (embeddings)
- @aws-sdk/client-s3 (S3 uploads)
- @aws-sdk/s3-request-presigner (pre-signed URLs)

### Database
- AWS RDS PostgreSQL 16.8
- pgvector extension v0.8.0
- Vector similarity search with IVFFlat indexing
- KMS encryption at rest
- SSL/TLS encryption in transit

### Cloud Infrastructure
- **AWS RDS:** Managed PostgreSQL database
- **AWS S3:** Object storage for resume files
- **AWS KMS:** Key management for encryption
- **AWS CDK:** Infrastructure as Code (TypeScript)
- **AWS CLI:** Command-line management tools

### AI Services
- OpenAI GPT-4o-mini (batch processing)
- all-MiniLM-L6-v2 embedding model (384 dimensions)
- Concurrent batch processing (15 candidates/batch)
- Strict confidence scoring (4+ required)

### DevOps
- Docker & Docker Compose (local development)
- Git version control
- Environment-based configuration
- Automated database initialization
- CI/CD ready architecture

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

**Version:** 3.0  
**Last Updated:** October 28, 2025  
**Branch:** anik-infra-testing  
**Status:** Production Ready with AWS Infrastructure  
