require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

console.log('Testing OpenAI API connection...');
console.log('API Key (first 20 chars):', process.env.OPENAI_API_KEY?.substring(0, 20) || 'NOT FOUND');
console.log('API Key (last 10 chars):', process.env.OPENAI_API_KEY?.slice(-10) || 'NOT FOUND');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testAPI() {
  try {
    const response = await openai.models.list();
    console.log('✅ SUCCESS! API key works!');
    console.log('Available models:', response.data.slice(0, 3).map(m => m.id));
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    if (error.status === 401) {
      console.log('The API key is invalid or expired');
    }
  }
}

testAPI(); 