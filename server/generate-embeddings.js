import pg from 'pg';
import dotenv from 'dotenv';
import { generateEmbedding } from './src/embeddings.js';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function generateEmbeddingsForExistingResumes() {
  console.log('🚀 Starting embedding generation for existing resumes...\n');
  
  try {
    // Get all resumes without embeddings
    const result = await pool.query(`
      SELECT resume_id, extracted_text
      FROM resumes
      WHERE extracted_text IS NOT NULL 
        AND extracted_text != ''
        AND embedding IS NULL
    `);
    
    console.log(`Found ${result.rows.length} resumes without embeddings\n`);
    
    if (result.rows.length === 0) {
      console.log('✅ All resumes already have embeddings!');
      await pool.end();
      return;
    }
    
    // Generate embeddings for each resume
    for (let i = 0; i < result.rows.length; i++) {
      const resume = result.rows[i];
      console.log(`[${i + 1}/${result.rows.length}] Processing resume ID ${resume.resume_id}...`);
      
      try {
        const embedding = await generateEmbedding(resume.extracted_text);
        
        await pool.query(`
          UPDATE resumes
          SET embedding = $1
          WHERE resume_id = $2
        `, [JSON.stringify(embedding), resume.resume_id]);
        
        console.log(`✅ Generated ${embedding.length}-dimensional embedding\n`);
      } catch (error) {
        console.error(`❌ Error for resume ${resume.resume_id}:`, error.message);
        console.log('');
      }
    }
    
    console.log('🎉 Embedding generation complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

generateEmbeddingsForExistingResumes();
