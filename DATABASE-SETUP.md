# Database Setup Guide

## What You Have Now

Your database setup is **complete and correct**! Here's what's in place:

### 1. Docker Configuration (`docker-compose.yml`)
- PostgreSQL 16 database
- User: `tamu`, Password: `secret`, Database: `law_portal`
- Port: 5432 (or change to 55432 if you have PostgreSQL running locally)
- Auto-initialization from `db/init/001_schema.sql`
- Health checks enabled

### 2. Database Schema (`db/init/001_schema.sql`)
Two tables:
- **applicants**: Stores applicant info (name, email, phone, notes)
- **resumes**: Stores file paths and extracted text (linked to applicants)

### 3. Backend Server (`server/`)
- Express.js API with PostgreSQL connection
- Endpoints:
  - `GET /health` - Check server and database status
  - `POST /api/applications` - Submit new application
  - `GET /api/applications` - Get all applications
  - `GET /api/applications/:id` - Get single application
- Dependencies installed

### 4. Frontend Integration
- Updated `AdjunctApplicationPage.jsx` to submit to API
- Environment variable configured (`VITE_API_URL`)
- Form data now saves to database

## How to Run Everything

### Step 1: Start Docker Desktop
Make sure Docker Desktop is running on your Mac.

### Step 2: Start the Database
```bash
# From project root
docker-compose up -d
```

This will:
- Download PostgreSQL image (first time only)
- Create the database
- Run the schema initialization
- Keep running in background

### Step 3: Verify Database
```bash
docker-compose ps
```

Should show the `db` service as "healthy"

### Step 4: Start the Backend Server
```bash
cd server
npm run dev
```

You should see:
```
Connected to PostgreSQL database
Server running on http://localhost:4000
Health check: http://localhost:4000/health
```

### Step 5: Test the API
Open http://localhost:4000/health in your browser.

You should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-09T..."
}
```

### Step 6: Start the Frontend
In a new terminal:
```bash
cd frontend
npm run dev
```

Visit http://localhost:5173

### Step 7: Test the Complete Flow
1. Go to http://localhost:5173
2. Click "Login with NetID"
3. Click "Adjunct Application Portal"
4. Fill out the form:
   - Full Name: Test User
   - Email: test@tamu.edu
   - Phone: (optional) 555-123-4567
   - Upload a PDF resume
5. Click "Submit Application"
6. Confirm submission

The data should now be in your database!

## Verify Data in Database

### Option 1: Using Docker
```bash
docker-compose exec db psql -U tamu -d law_portal
```

Then run:
```sql
SELECT * FROM applicants;
SELECT * FROM resumes;
```

Exit with `\q`

### Option 2: Using the API
Open http://localhost:4000/api/applications in your browser to see all submissions.

## Troubleshooting

### Port 5432 already in use
If you have PostgreSQL installed locally:

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

### Database connection refused
Make sure Docker is running:
```bash
docker-compose ps
docker-compose logs db
```

### Reset database (delete all data)
```bash
docker-compose down -v
docker-compose up -d
```

This will delete all data and recreate the schema.

### Check server logs
The server logs will show all database queries and errors.

### Test database connection manually
```bash
cd server
node -e "const pg = require('pg'); const pool = new pg.Pool({connectionString: 'postgres://tamu:secret@localhost:5432/law_portal'}); pool.query('SELECT NOW()').then(r => console.log('Connected:', r.rows[0])).catch(e => console.error('Error:', e.message)).finally(() => pool.end());"
```

## Next Steps

### Current Limitations
- File uploads are not yet implemented (only filenames are saved)
- No file storage system yet
- No authentication yet

### Future Improvements
1. **File Upload Implementation**
   - Use `multer` middleware for file uploads
   - Store files in `/uploads` directory or cloud storage
   - Save file paths in database

2. **Authentication**
   - Integrate with TAMU NetID / Microsoft Entra ID
   - Add JWT tokens for session management
   - Protect API endpoints

3. **Admin Dashboard**
   - Create admin page to view all applications
   - Add search and filter functionality
   - Download resumes

4. **AI Integration**
   - Extract text from PDF resumes
   - Store in `extracted_text` column
   - Enable semantic search

## What's Working Right Now

- Database is set up correctly  
- Backend API is functional  
- Frontend connects to backend  
- Form submissions save to database  
- All validation still works  
- Phone number is optional  
- Oswald font is applied  

You're doing great! The database setup is solid.
