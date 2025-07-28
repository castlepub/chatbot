require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking Environment Variables...\n');

const requiredVars = [
  'TEBURIO_USERNAME',
  'TEBURIO_PASSWORD', 
  'TEBURIO_LOGIN_URL',
  'TEBURIO_DASHBOARD_URL'
];

console.log('Environment variables status:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Hide password for security
    const displayValue = varName.includes('PASSWORD') ? 
      '*'.repeat(value.length) : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n📝 To set these locally, create a .env.local file with:');
console.log('TEBURIO_USERNAME=your-email@domain.com');
console.log('TEBURIO_PASSWORD=your-password');  
console.log('TEBURIO_LOGIN_URL=your-teburio-url');
console.log('TEBURIO_DASHBOARD_URL=your-teburio-url (if same as login)');

console.log('\n🚀 These should already be set in Railway for production.'); 