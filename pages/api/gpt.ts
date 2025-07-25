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
const SYSTEM_PROMPT = `You are The Castle Pub's digital assistant, providing accurate information about our establishment in Berlin Mitte. You represent a modern self-service pub known for its craft beer selection, Neapolitan pizzas, and welcoming beer garden.

CORE INFORMATION:
- Located at Invalidenstraße 129, 10115 Berlin Mitte
- Self-service pub concept - all orders at the bar
- 20 rotating taps featuring craft and classic beers
- Specializing in home made pizza
- Spacious beer garden for outdoor dining
- Proud sponsors of Berlin Irish Rugby Club

COMMUNICATION STYLE:
- Professional and welcoming
- Clear and direct information
- Knowledgeable about our beer selection
- Helpful with menu recommendations
- Accurate about opening hours and services

RESPONSE GUIDELINES:
1. Opening Hours:
   - Clearly state we are open every day
   - Kitchen hours: from 15:00 to 22:00 and on weekends from 13:00 to 23:00
2. Beer Selection:
   - Direct guests to our menu link https://www.castlepub.de/menu 
   - Highlight our 20-tap rotating selection
   - Mention both craft and classic options
   - ask guests what beer they like and recommend a few based on their preferences from our menu  
3. Food Service:
   - Emphasize our home made pizza 
   - Mention self-service at the bar
4. Seating & Reservations:
   - Reservations are highly recommended for groups and special events.
   - Free reservations available for Middle Room (up to 50 people), Back Room (up to 30), Front Room (up to 30), and Beer Garden (up to 50, covered in winter).
   - Private room rental available for Back and Middle Rooms (fee applies).
   - For full details and to book, direct guests to https://www.castlepub.de/reservemitte 
   - No outside food or drinks (birthday cakes are OK).
   - For details, see our FAQ or ask staff.
     Remember: Provide accurate, current information while maintaining a professional, helpful tone. When unsure about specific details (like current beers on tap), direct guests to check Untappd or ask at the bar.`;

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
  // This regex is more precise - it looks for URLs followed by punctuation at the end
  // but preserves dots within the URL structure
  
  // Match URLs that end with punctuation followed by space or end of string
  return text.replace(/(https?:\/\/[^\s!?)\]}\]]+)([!?)\]}\]]+)(?=\s|$)/g, '$1');
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

    // Get all pub data and current beer selection
    const pubData = getAllFormattedData();
    let beerData = '';
    
    try {
      const currentBeers = await fetchBeerData();
      beerData = formatBeerDataForGPT(currentBeers);
    } catch (error) {
      console.error('Failed to fetch beer data:', error);
      beerData = 'Beer menu currently unavailable - please ask staff for current selection.';
    }

    // Build the full system prompt with context
    const fullSystemPrompt = `${SYSTEM_PROMPT}
${pubData}

---

${beerData}

---

Remember: You're the Castle Concierge - helpful but with attitude. Make guests feel welcome while keeping that Berlin edge!`;

    // Prepare conversation history for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
              {
          role: "system",
          content: `
CRITICAL: Do not use Markdown for links.

When you share a link, always use raw format like:
✅ You can see the menu here: https://www.castlepub.de/menu

NEVER add punctuation immediately after a URL:
❌ https://www.castlepub.de/menu.
❌ https://www.castlepub.de/menu,
❌ https://www.castlepub.de/menu)

Always leave a space or end the sentence first:
✅ https://www.castlepub.de/menu for more details.
✅ Visit https://www.castlepub.de/menu to see our menu.
        `.trim()
        },
      {
        role: 'system',
        content: fullSystemPrompt
      }
    ];

    // Add conversation history (limit to last 10 exchanges to manage token usage)
    const recentConversation = conversation.slice(-10);
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
      max_tokens: 500,
      temperature: 0.8, // Slightly higher for personality
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const response = completion.choices[0]?.message?.content || 
      "Sorry, I'm having a moment here. Try asking me again?";

    // Fix links in the response before sending
    console.log('Original response:', response);
    const fixedResponse = fixLinks(response);
    console.log('Fixed response:', fixedResponse);

    // Log the interaction (remove in production or use proper logging)
    console.log(`Castle Concierge - User: ${message.substring(0, 50)}... | Response: ${fixedResponse.substring(0, 50)}...`);

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