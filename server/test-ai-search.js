import axios from 'axios';

async function testAISearch() {
  try {
    console.log('Testing AI Search endpoint...\n');
    
    const response = await axios.post('http://localhost:4000/api/ai-search', {
      course: 'Cyber Law',
      description: 'Teaching cybersecurity regulations, data privacy, GDPR, and data breach law'
    });

    console.log('✓ Success!');
    console.log('\nResults:');
    console.log(`Total candidates found: ${response.data.totalFound}`);
    console.log(`Searched applicants: ${response.data.searchedApplicants}`);
    console.log('\nCandidates:');
    console.log(JSON.stringify(response.data.candidates, null, 2));
    
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
}

testAISearch();
