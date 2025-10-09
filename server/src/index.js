import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Configure multer for file uploads (store in memory for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// Submit application endpoint with file upload
app.post('/api/applications', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 }
]), async (req, res) => {
  const { fullName, email, phone, notes } = req.body;
  const resumeFile = req.files?.resume?.[0];
  const coverLetterFile = req.files?.coverLetter?.[0];

  // Validation
  if (!fullName || !email) {
    return res.status(400).json({ 
      error: 'Full name and email are required' 
    });
  }

  if (!resumeFile) {
    return res.status(400).json({ 
      error: 'Resume is required' 
    });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if applicant with this email already exists
    const existingApplicant = await client.query(
      `SELECT applicant_id FROM applicants WHERE email = $1`,
      [email]
    );

    // If exists, delete old application (CASCADE will delete resume too)
    if (existingApplicant.rows.length > 0) {
      const oldApplicantId = existingApplicant.rows[0].applicant_id;
      await client.query(
        `DELETE FROM applicants WHERE applicant_id = $1`,
        [oldApplicantId]
      );
      console.log(`Replaced old application for ${email}`);
    }

    // Extract text from resume PDF (using pdf-parse v2 API)
    let resumeText = '';
    try {
      const parser = new PDFParse({ data: resumeFile.buffer });
      const resumeData = await parser.getText();
      await parser.destroy();
      resumeText = resumeData.text || '';
      console.log(`Extracted ${resumeText.length} characters from resume`);
    } catch (pdfError) {
      console.error('Error extracting PDF text:', pdfError.message);
      // Continue without text extraction rather than failing
    }

    // Extract text from cover letter PDF (if provided)
    let coverLetterText = '';
    if (coverLetterFile) {
      try {
        const parser = new PDFParse({ data: coverLetterFile.buffer });
        const coverData = await parser.getText();
        await parser.destroy();
        coverLetterText = coverData.text || '';
        console.log(`Extracted ${coverLetterText.length} characters from cover letter`);
      } catch (pdfError) {
        console.error('Error extracting cover letter text:', pdfError.message);
      }
    }

    // Combine extracted texts
    const combinedText = [
      resumeText,
      coverLetterText ? `\n\n--- COVER LETTER ---\n\n${coverLetterText}` : ''
    ].join('');

    // Insert new applicant
    const applicantResult = await client.query(
      `INSERT INTO applicants (name, email, phone, note) 
       VALUES ($1, $2, $3, $4) 
       RETURNING applicant_id`,
      [fullName, email, phone || null, notes || null]
    );

    const applicantId = applicantResult.rows[0].applicant_id;

    // Insert resume/cover letter info with extracted text
    // TODO: Replace filenames with S3 URLs later
    await client.query(
      `INSERT INTO resumes (applicant_id, resume_file, cover_letter_file, extracted_text) 
       VALUES ($1, $2, $3, $4)`,
      [
        applicantId, 
        resumeFile.originalname,
        coverLetterFile?.originalname || null,
        combinedText || null
      ]
    );

    await client.query('COMMIT');

    const isUpdate = existingApplicant.rows.length > 0;

    res.status(201).json({ 
      success: true, 
      message: isUpdate 
        ? 'Application updated successfully' 
        : 'Application submitted successfully',
      applicantId,
      extractedTextLength: combinedText.length,
      isUpdate
    });

  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Error submitting application:', error);
    res.status(500).json({ 
      error: 'Failed to submit application',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Get all applications (for admin view later)
app.get('/api/applications', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.applicant_id,
        a.name,
        a.email,
        a.phone,
        a.note,
        a.created_at,
        r.resume_file,
        r.cover_letter_file,
        r.uploaded_at
      FROM applicants a
      LEFT JOIN resumes r ON a.applicant_id = r.applicant_id
      ORDER BY a.created_at DESC
    `);

    res.json({ 
      success: true, 
      applications: result.rows 
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch applications',
      details: error.message 
    });
  }
});

// Get single application by ID
app.get('/api/applications/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        a.applicant_id,
        a.name,
        a.email,
        a.phone,
        a.note,
        a.created_at,
        r.resume_file,
        r.cover_letter_file,
        r.extracted_text,
        r.uploaded_at
      FROM applicants a
      LEFT JOIN resumes r ON a.applicant_id = r.applicant_id
      WHERE a.applicant_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Application not found' 
      });
    }

    res.json({ 
      success: true, 
      application: result.rows[0] 
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ 
      error: 'Failed to fetch application',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  // Test database connection on startup
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database');
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});
