const { Pool } = require('pg');
require('dotenv').config({ path: '../server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkApplicant() {
  try {
    const searchTerm = process.argv[2] || 'adeeb';
    
    const result = await pool.query(
      `SELECT applicant_id, name, email, phone, role, hired 
       FROM applicants 
       WHERE name ILIKE $1 OR email ILIKE $1
       ORDER BY applicant_id`,
      [`%${searchTerm}%`]
    );

    console.log(`\nFound ${result.rows.length} applicant(s) matching "${searchTerm}":\n`);
    
    if (result.rows.length > 0) {
      result.rows.forEach(app => {
        console.log(`ID: ${app.applicant_id}`);
        console.log(`Name: ${app.name}`);
        console.log(`Email: ${app.email}`);
        console.log(`Phone: ${app.phone || 'N/A'}`);
        console.log(`Role: ${app.role || 'None'}`);
        console.log(`Hired: ${app.hired ? 'Yes' : 'No'}`);
        console.log('---');
      });
    } else {
      console.log(`No applicants found matching "${searchTerm}"`);
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkApplicant();
