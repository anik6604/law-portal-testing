import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
});

async function addRoleColumn() {
  try {
    console.log('Adding role column to applicants table...');
    
    await pool.query(`
      ALTER TABLE applicants 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'None' 
      CHECK (role IN ('Faculty', 'Course Manager', 'None'))
    `);
    
    console.log('✅ Role column added successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addRoleColumn();
