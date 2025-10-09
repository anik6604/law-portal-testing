# PDF Text Extraction Feature

## What's Implemented

The application now automatically extracts text from uploaded PDF resumes and cover letters!

### How It Works

1. **User uploads PDF files** (resume and optionally cover letter)
2. **Server receives the files** via multipart/form-data
3. **Text extraction** happens using `pdf-parse` library
4. **Extracted text is stored** in the `extracted_text` column in the database
5. **Ready for AI queries** - you can now search through resume content

### Technical Details

**Backend (`server/src/index.js`):**
- Uses `multer` for handling file uploads (stores in memory)
- Uses `pdf-parse` to extract text from PDF buffers
- Combines resume + cover letter text with a separator
- Stores in `resumes.extracted_text` column

**Frontend (`AdjunctApplicationPage.jsx`):**
- Uses `FormData` API to send files
- Properly handles file uploads with multipart/form-data
- Clears file inputs after successful submission

### Testing the Feature

1. Start everything (database, server, frontend)
2. Submit an application with a PDF resume
3. Check the extracted text:

```bash
# View extracted text length
docker-compose exec db psql -U tamu -d law_portal -c "SELECT applicant_id, LENGTH(extracted_text) as text_length FROM resumes;"

# View first 500 characters of extracted text
docker-compose exec db psql -U tamu -d law_portal -c "SELECT applicant_id, LEFT(extracted_text, 500) as sample_text FROM resumes;"

# Full text (can be very long!)
docker-compose exec db psql -U tamu -d law_portal -c "SELECT extracted_text FROM resumes WHERE applicant_id = 1;"
```

Or via API:
```bash
curl http://localhost:4000/api/applications/1
```

### What's Next

1. **S3 File Storage**
   - Upload PDFs to AWS S3
   - Store S3 URLs instead of filenames
   - Implement signed URLs for secure downloads

2. **AI-Powered Search**
   - Use extracted text for semantic search
   - "Find candidates who can teach Cyber Law"
   - "Who has experience in contract law?"
   - Vector embeddings for better matching

3. **Admin Dashboard**
   - View all applications
   - Search through extracted resume text
   - Download original PDFs

### File Size Limits

- Maximum file size: **10MB per file**
- Only PDF files accepted
- Both resume and cover letter are extracted

### Current Limitations

- Files are not permanently stored (only filenames saved)
- No file download endpoint yet
- Text extraction works best with text-based PDFs (not scanned images)

### Database Schema

The `extracted_text` column in the `resumes` table:
```sql
extracted_text TEXT  -- Can store very large amounts of text
```

Combined format:
```
[Resume text content]

--- COVER LETTER ---

[Cover letter text content]
```

---

**Text extraction is working!** You can now query resume content in the database!
