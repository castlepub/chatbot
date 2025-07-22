require('dotenv').config({ path: '.env.local' });

console.log('=== Environment Variables Debug ===');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
console.log('OPENAI_PROJECT_ID:', process.env.OPENAI_PROJECT_ID);
console.log('All env variables:', process.env);
console.log('================================'); 