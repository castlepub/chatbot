// Simple end-to-end test for the deployed chatbot /api/reservations
// Usage: node test-reservation-chat.js [CHATBOT_URL]

const BASE = process.env.CHATBOT_URL || process.argv[2] || 'https://chatbot-production-ca03.up.railway.app';
const sessionId = 'railway-test-123';

async function postMessage(message) {
  const res = await fetch(`${BASE}/api/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return data;
}

async function run() {
  console.log(`Testing chatbot at: ${BASE}`);
  const steps = [
    'I want to book a table',
    '2025-08-08',
    '19:00',
    '4',
    'no preference',
    'Jane Doe',
    'jane@example.com',
    '+49 123 456789',
    'none',
    'confirm'
  ];

  for (const msg of steps) {
    console.log(`\n> ${msg}`);
    try {
      const data = await postMessage(msg);
      console.log(`< ${data.reply || JSON.stringify(data)}`);
    } catch (e) {
      console.error(`! Error on message '${msg}':`, e.message);
      process.exit(1);
    }
  }

  console.log('\n✅ Conversation test completed');
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
