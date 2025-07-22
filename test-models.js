require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function listModels() {
  try {
    console.log('=== API KEY DEBUG ===');
    console.log('API Key first 20 chars:', process.env.OPENAI_API_KEY?.substring(0, 20) || 'NOT FOUND');
    console.log('API Key last 10 chars:', process.env.OPENAI_API_KEY?.slice(-10) || 'NOT FOUND');
    console.log('API Key length:', process.env.OPENAI_API_KEY?.length || 0);
    console.log('=====================\n');

    console.log('Attempting to list available models...');
    const models = await openai.models.list();
    console.log('\nAvailable models:');
    models.data.forEach(model => {
      console.log(`- ${model.id}`);
    });
  } catch (error) {
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

listModels(); 