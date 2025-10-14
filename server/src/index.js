import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import multer from 'multer';
import axios from 'axios';
import { createRequire } from 'module';
import { generateEmbedding } from './embeddings.js';
import OpenAI from 'openai';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Extract text from resume PDF
    let resumeText = '';
    try {
      const resumeData = await pdf(resumeFile.buffer);
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
        const coverData = await pdf(coverLetterFile.buffer);
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

    // Generate embedding vector for semantic search
    let embedding = null;
    if (combinedText) {
      try {
        console.log('Generating embedding vector...');
        embedding = await generateEmbedding(combinedText);
        console.log(`Generated embedding with ${embedding.length} dimensions`);
      } catch (embError) {
        console.error('Error generating embedding:', embError.message);
        // Continue without embedding
      }
    }

    // Insert new applicant
    const applicantResult = await client.query(
      `INSERT INTO applicants (name, email, phone, note) 
       VALUES ($1, $2, $3, $4) 
       RETURNING applicant_id`,
      [fullName, email, phone || null, notes || null]
    );

    const applicantId = applicantResult.rows[0].applicant_id;

    // Insert resume/cover letter info with extracted text and embedding
    // TODO: Replace filenames with S3 URLs later
    await client.query(
      `INSERT INTO resumes (applicant_id, resume_file, cover_letter_file, extracted_text, embedding) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        applicantId,
        resumeFile.originalname,
        coverLetterFile?.originalname || null,
        combinedText || null,
        embedding ? JSON.stringify(embedding) : null
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

// AI-powered candidate search using Gemma 3
app.post('/api/ai-search', async (req, res) => {
  const { course, description } = req.body;

  if (!course) {
    return res.status(400).json({
      error: 'Course name is required'
    });
  }

  try {
    console.log(`AI Search started for course: ${course}`);

    // Step 1: Generate embedding for the search query
    console.log('Generating query embedding...');
    const queryEmbedding = await generateEmbedding(
      `${course} ${description || ''}`.trim()
    );
    console.log('Query embedding generated');

    // Convert embedding to Postgres-safe vector format
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Step 2: Find top candidates using vector similarity (increased for better recall)
    const SEARCH_LIMIT = Number(process.env.SEARCH_LIMIT || 200);
    const result = await pool.query(`
      SELECT 
        a.applicant_id,
        a.name,
        a.email,
        a.note,
        r.resume_file,
        r.extracted_text,
        1 - (r.embedding <=> $1::vector) as similarity
      FROM applicants a
      LEFT JOIN resumes r ON a.applicant_id = r.applicant_id
      WHERE r.embedding IS NOT NULL
      ORDER BY r.embedding <=> $1::vector
      LIMIT ${SEARCH_LIMIT}
    `, [vectorString]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        candidates: [],
        totalFound: 0,
        searchedApplicants: 0,
        message: 'No applicants with resume embeddings found in database'
      });
    }

    console.log(`Found ${result.rows.length} most relevant applicants (from all in database)`);
    
    // Step 2: Implement batching to handle large result sets efficiently
    const BATCH_SIZE = 15; // Process 15 candidates at a time for optimal token usage
    const batches = [];
    for (let i = 0; i < result.rows.length; i += BATCH_SIZE) {
      batches.push(result.rows.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Processing ${result.rows.length} candidates in ${batches.length} batches of up to ${BATCH_SIZE}`);

    // Helper function to build context for a batch
    const buildBatchContext = (batch, batchNum) => {
      return batch.map((app, idx) => {
        // Clean and trim resume text for efficiency (15k for better AI context)
        const cleanedText = (app.extracted_text || '')
          .replace(/\s+/g, ' ')
          .slice(0, 15000);

        return `
CANDIDATE ${idx + 1}
ID: ${app.applicant_id}
Name: ${app.name || 'N/A'}
Email: ${app.email || 'N/A'}
Notes: ${app.note || 'None'}
Resume Snippet:
${cleanedText}
---`;
      }).join('\n');
    };

    // Step 3: Craft the system message (reusable for all batches)
    const SYSTEM_JSON_RULES = `You are a structured reasoning API that analyzes law faculty candidates for teaching assignments.

Analyze the candidate list and return ONLY valid JSON:

{
  "candidates": [
    {"id": "<string>", "reason": "<=120 chars>", "confidence": <1-5>}
  ]
}

RULE ENFORCEMENT (MANDATORY):
- Each candidate MUST have id, reason, and confidence.
- Teaching or academic experience alone does NOT imply topical expertise.
- If resume lacks topic-relevant keywords (e.g., Cyber, Data, Privacy, Tax, Corporate, Environmental, Criminal, Trial), 
  confidence MUST NOT exceed 3.
- Confidence 5 = explicit match (clear evidence in text showing direct expertise in the specific course topic).
- Confidence 4 = strong but indirect relevance with transferable specialized experience.
- Default to 3 if uncertain or only moderate keyword matches.
- Reduce confidence by 2 points if reasoning relies only on general teaching experience without topic specialization.
- Do not include candidates whose only qualification is that they have taught law before.
- Exclude non-law candidates entirely.
- Output ONLY JSON, no text or markdown.

CONFIDENCE SCALE (STRICT):
5 = Rare. Explicit topical match with detailed evidence (e.g., "practiced cybersecurity law for 10 years")
4 = Strong related background with clear transferable specialization (e.g., "data privacy attorney")
3 = Moderate relevance, some keywords present, or general legal background with partial overlap
2 = Weak indirect evidence or tangential connection
1 = Minimal relation

Always ensure valid JSON and populate all fields for every record.`;

    // Step 4: Process batches concurrently with rate limiting
    const MODEL = "gpt-4o-mini";
    console.log(`Using model: ${MODEL} with concurrent batch processing`);
    
    const batchPromises = batches.map(async (batch, batchIdx) => {
      const batchContext = buildBatchContext(batch, batchIdx + 1);
      const USER_PROMPT = `Course: ${course}
${description ? `Description: ${description}` : ''}

Goal: Identify candidates with BOTH legal credentials AND specific relevance to this course topic.
Be inclusive, but assign lower confidence to candidates who lack explicit topical keywords or specialization.

Critical Rules:
- Only use IDs shown below.
- Check for course-relevant keywords in resume text.
- If NO topical keywords found, confidence cannot exceed 3.
- Generic teaching experience ≠ topical expertise. Do not boost confidence for teaching alone.
- Confidence 5 is RARE and requires explicit evidence of direct expertise.
- Default to confidence 3 or 4 for most candidates.

Batch ${batchIdx + 1}/${batches.length} - Analyze these candidates:
${batchContext}

Return JSON only: {"candidates": [{"id": "...", "reason": "...", "confidence": 1-5}]}`;

      console.log(`Batch ${batchIdx + 1}: Prompt length ${USER_PROMPT.length} chars, processing ${batch.length} candidates`);

      try {
        const completion = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_JSON_RULES },
            { role: 'user', content: USER_PROMPT }
          ],
          response_format: { type: "json_object" },
          temperature: 0,
          max_tokens: 1500
        });

        const aiResponse = completion.choices[0].message.content;
        console.log(`Batch ${batchIdx + 1}: Received response`);

        if (!aiResponse || aiResponse.trim() === "") {
          console.error(`Batch ${batchIdx + 1}: Empty AI response`);
          return [];
        }

        // Parse the response
        try {
          const cleaned = aiResponse.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          const candidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
          console.log(`Batch ${batchIdx + 1}: Parsed ${candidates.length} candidates`);
          return candidates;
        } catch (parseError) {
          console.warn(`Batch ${batchIdx + 1}: JSON parse error, attempting repair`);
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return Array.isArray(parsed?.candidates) ? parsed.candidates : [];
          }
          console.error(`Batch ${batchIdx + 1}: Failed to parse response`);
          return [];
        }
      } catch (error) {
        console.error(`Batch ${batchIdx + 1}: Error:`, error.message);
        return [];
      }
    });

    // Wait for all batches to complete
    console.log(`Processing ${batches.length} batches concurrently...`);
    const batchResults = await Promise.all(batchPromises);
    
    // Combine all batch results
    const candidates = batchResults.flat();
    console.log(`Total candidates from all batches: ${candidates.length}`);

    // Step 6: Enrich candidates by ID (much more stable than email matching)
    const idToRow = new Map(result.rows.map(r => [String(r.applicant_id), r]));

    const enrichedCandidates = candidates
      .map(c => {
        const row = idToRow.get(String(c.id));
        if (!row) {
          console.warn(`Model returned ID ${c.id} which is not in the result set`);
          return null; // model picked an ID that isn't in this batch
        }

        const conf = Number.isFinite(c.confidence) ? c.confidence : 0;

        return {
          id: row.applicant_id,
          name: row.name || '(name missing)',
          email: row.email || null,
          note: row.note || '',
          reasoning: (c.reason || '').slice(0, 200),
          confidence: conf,
          resumeLink: `/api/applications/${row.applicant_id}`,
          resumeFile: row.resume_file
        };
      })
      .filter(Boolean)
      .filter(c => c.confidence > 2) // Filter out low confidence matches (≤2)
      .sort((a, b) => b.confidence - a.confidence);

    console.log(`AI Search complete: ${enrichedCandidates.length} qualified candidates found (confidence > 2, ranked by score)`);

    res.json({
      success: true,
      candidates: enrichedCandidates,
      totalFound: enrichedCandidates.length,
      searchedApplicants: result.rows.length,
      course: course,
      description: description || null
    });

  } catch (error) {
    console.error('Error in AI search:', error);

    if (error.status === 401) {
      return res.status(401).json({
        error: 'OpenAI API authentication failed',
        details: 'Please check your OPENAI_API_KEY in .env file'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'OpenAI API rate limit exceeded',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to perform AI search',
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
