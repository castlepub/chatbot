import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getAllFormattedData } from '../../utils/formatData';
import { fetchBeerData, formatBeerDataForGPT } from '../../utils/fetchBeerData';

// DEBUG: Log what API key we're loading
console.log('=== API KEY DEBUG ===');
console.log('API Key first 20 chars:', process.env.OPENAI_API_KEY?.substring(0, 20) || 'NOT FOUND');
console.log('API Key last 10 chars:', process.env.OPENAI_API_KEY?.slice(-10) || 'NOT FOUND');
console.log('API Key full length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('=====================');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: 'proj_sbPfzENXvsKlbcCtkOgQwZ3k' // Explicit project ID for Railway/OpenAI
});

        // Telegram notification function
        async function sendBotUsageNotification(userMessage: string, botResponse: string, req: NextApiRequest) {
          try {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID; // Can be personal chat ID or group chat ID
    
    if (!botToken || !chatId) {
      console.error('Telegram bot token or chat ID not set in environment variables.');
      return;
    }

    const message = `
🤖 *Castle Pub Bot Usage*

👤 *User Message:*
${userMessage.length > 200 ? userMessage.substring(0, 200) + '...' : userMessage}

🤖 *Bot Response:*
${botResponse.length > 300 ? botResponse.substring(0, 300) + '...' : botResponse}

⏰ *Timestamp:* ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}
🌐 *IP:* ${req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown'}
    `.trim();

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    console.log('Telegram notification sent successfully');
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

// Castle Concierge system prompt
const SYSTEM_PROMPT = `You are The Castle Pub's digital assistant in Berlin Mitte. Castle-only policy: ONLY answer Castle-related questions. Redirect others with "I'm the Castle Concierge - I only help with Castle Pub questions! What would you like to know about our craft beers, events, or services?"

CORE INFO: Invalidenstraße 129, Berlin Mitte. Self-service pub with 20 craft beer taps, Neapolitan pizza, beer garden. Open daily, kitchen 15:00-22:00 (weekends 13:00-23:00).

RESPONSE GUIDELINES:
- Events: Check upcoming events data for specific dates/times
- Beer: Direct to https://www.castlepub.de/menu, recommend based on preferences
- Reservations: Direct to https://www.castlepub.de/reservemitte
- Castle Quiz: Every Monday 8:00 PM
- Always Castle-focused, redirect non-Castle topics back to Castle offerings`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  conversation?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  error?: string;
}

// Add this function to fix links in the output
function fixLinks(text: string): string {
  // Remove trailing punctuation immediately after URLs
  // This regex matches URLs followed by common punctuation marks
  let cleaned = text.replace(/(https?:\/\/[^\s]+?)([.,;!?)\]}\]]+)(?=\s|$)/g, '$1');
  
  // Also fix URLs that might have trailing punctuation without space
  cleaned = cleaned.replace(/(https?:\/\/[^\s]+?)([.,;!?)\]}\]]+)$/g, '$1');
  
  // Remove any markdown link formatting
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$2');
  
  return cleaned;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      response: '', 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { message, conversation = [] }: ChatRequest = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        response: '',
        error: 'Message is required and must be a string.'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({
        response: '',
        error: 'ChatBot temporarily unavailable. Please try again later.'
      });
    }

    // Get pub data efficiently
    let pubData = '';
    let beerData = '';
    
    try {
      // Load data in parallel for speed
      const [formattedData, currentBeers] = await Promise.all([
        getAllFormattedData(),
        fetchBeerData().catch(() => null)
      ]);
      
      pubData = formattedData;
      beerData = currentBeers ? formatBeerDataForGPT(currentBeers) : 'Beer menu currently unavailable - please ask staff for current selection.';
    } catch (error) {
      console.error('Failed to fetch data:', error);
      pubData = 'Castle Pub data temporarily unavailable.';
      beerData = 'Beer menu currently unavailable - please ask staff for current selection.';
    }

    // Build the full system prompt with context
    const fullSystemPrompt = `${SYSTEM_PROMPT}
${pubData}

---

${beerData}

---

Remember: You're the Castle Concierge - helpful but with attitude. Make guests feel welcome while keeping that Berlin edge!`;

    // Simple duplicate-message short-circuit (within 15s) to avoid reprocessing
    const cacheKey = `lastMsg:${req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anon'}`;
    // naive in-memory store
    (global as any).__castleMsgCache = (global as any).__castleMsgCache || new Map<string, { msg: string; ts: number }>();
    const msgCache: Map<string, { msg: string; ts: number }> = (global as any).__castleMsgCache;
    const prev = msgCache.get(cacheKey);
    const nowTs = Date.now();
    if (prev && prev.msg === message && nowTs - prev.ts < 15000) {
      return res.status(200).json({ response: 'One sec, I\'m already on it…' });
    }
    msgCache.set(cacheKey, { msg: message, ts: nowTs });

    // Prepare conversation history for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
CRITICAL LINK FORMATTING RULES:

1. NEVER use Markdown formatting for links
2. NEVER add punctuation immediately after a URL
3. Always provide clean, clickable URLs

CORRECT FORMAT:
✅ "You can see the menu here: https://www.castlepub.de/menu"
✅ "Visit https://www.castlepub.de/menu to see our menu."
✅ "For reservations, go to https://www.castlepub.de/reservemitte"

INCORRECT FORMAT:
❌ "https://www.castlepub.de/menu."
❌ "https://www.castlepub.de/menu,"
❌ "https://www.castlepub.de/menu)"
❌ "[Menu](https://www.castlepub.de/menu)"

IMPORTANT: Always leave a space between the URL and any punctuation that follows.
        `.trim()
      },
      {
        role: 'system',
        content: fullSystemPrompt
      }
    ];

    // Add conversation history (limit to last 5 exchanges for faster processing)
    const recentConversation = conversation.slice(-5);
    recentConversation.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add the current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 300, // Reduced for faster responses
      temperature: 0.3, // Lower temperature for faster, more predictable output
      presence_penalty: 0.0, // Removed to speed up
      frequency_penalty: 0.0, // Removed to speed up
    });

    const response = completion.choices[0]?.message?.content || 
      "Sorry, I'm having a moment here. Try asking me again?";

    // Fix links in the response before sending
    const fixedResponse = fixLinks(response);

    // Send notification about bot usage (don't await to avoid blocking the response)
    sendBotUsageNotification(message, fixedResponse, req).catch(error => {
      console.error('Failed to send notification:', error);
    });

    return res.status(200).json({ response: fixedResponse });

  } catch (error) {
    console.error('Castle Concierge API Error:', error);
    
    // Different error messages based on error type
    let errorMessage = "I'm having technical difficulties. Give me a moment and try again.";
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = "My connection to the main system is down. Please try again later.";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "Whoa there, slow down! Too many questions at once. Give me a second.";
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = "Network's being a bit slow tonight. Try again in a moment.";
      }
    }

    return res.status(500).json({
      response: '',
      error: errorMessage
    });
  }
} 