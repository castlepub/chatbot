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

// Castle Concierge system prompt
const SYSTEM_PROMPT = `You are The Castle Pub's digital assistant, providing accurate information about our establishment in Berlin Mitte. You represent a modern self-service pub known for its craft beer selection, Neapolitan pizzas, and welcoming beer garden.

CORE INFORMATION:
- Located at Invalidenstraße 129, 10115 Berlin Mitte
- Self-service pub concept - all orders at the bar
- 20 rotating taps featuring craft and classic beers
- Specializing in authentic Neapolitan pizza
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
   - Clearly state we're closed Mondays
   - Kitchen hours: 17:00-23:00 daily
   - Accurate closing times for each day
2. Beer Selection:
   - Direct guests to Untappd for current tap list
   - Highlight our 20-tap rotating selection
   - Mention both craft and classic options
3. Food Service:
   - Emphasize our Neapolitan pizza specialty
   - Mention self-service at the bar
4. Seating & Reservations:
   - No reservations needed
   - Beer garden availability (weather dependent)

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

    // Log the interaction (remove in production or use proper logging)
    console.log(`Castle Concierge - User: ${message.substring(0, 50)}... | Response: ${response.substring(0, 50)}...`);

    return res.status(200).json({ response });

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