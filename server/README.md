# TAMU Law API Server

Backend API for the TAMU Law Adjunct Faculty Application Portal.

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Start Docker Database
From the project root:
```bash
docker-compose up -d
```

This will start PostgreSQL with the schema automatically initialized.

### 3. Verify Database Connection
```bash
docker-compose ps
```

Check that the `db` service is healthy.

### 4. Start the Server
```bash
npm run dev
```

The server will run on `http://localhost:4000`

### 5. Test the API
Visit: `http://localhost:4000/health`

You should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-09T..."
}
```

## API Endpoints

### POST /api/applications
Submit a new adjunct faculty application.

**Request Body:**
```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@tamu.edu",
  "phone": "555-123-4567",
  "notes": "Referred by Dean Smith",
  "resumeFile": "path/to/resume.pdf",
  "coverLetterFile": "path/to/cover.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "applicantId": 1
}
```

### GET /api/applications
Get all applications (for admin view).

**Response:**
```json
{
  "success": true,
  "applications": [...]
}
```

### GET /api/applications/:id
Get a specific application by ID.

**Response:**
```json
{
  "success": true,
  "application": {...}
}
```

## Database Schema

### applicants table
- `applicant_id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR 200, NOT NULL)
- `email` (VARCHAR 200, UNIQUE, NOT NULL)
- `phone` (VARCHAR 50, nullable)
- `note` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ)

### resumes table
- `resume_id` (SERIAL PRIMARY KEY)
- `applicant_id` (INT, FOREIGN KEY)
- `resume_file` (VARCHAR 500)
- `cover_letter_file` (VARCHAR 500)
- `extracted_text` (TEXT)
- `uploaded_at` (TIMESTAMPTZ)

## Troubleshooting

### Port 5432 already in use
If you have PostgreSQL running locally, change the port in `docker-compose.yml`:
```yaml
ports:
  - "55432:5432"
```

Then update `.env`:
```
DATABASE_URL=postgres://tamu:secret@localhost:55432/law_portal
```

### Database connection refused
Make sure Docker is running and the container is healthy:
```bash
docker-compose logs db
```

### Reset database
```bash
docker-compose down -v
docker-compose up -d
```
This will delete all data and reinitialize the schema.
