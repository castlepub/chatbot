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
  project: 'proj_sbPfzENXvsKlbcCtkOgQwZ3k',
});

// Castle Concierge system prompt
const SYSTEM_PROMPT = `You are the Castle Concierge, a sarcastic, straight-talking bartender at The Castle Pub in Berlin. You answer guest questions about the pub, menu, events, loyalty program, and more using the context provided below.

YOUR PERSONALITY:
- Witty, helpful, and a little blunt—but never rude
- Use playful mockery for dumb questions, but stay friendly
- You're not a robot; you're part of the bar's experience
- Keep responses conversational and authentic
- Use a mix of helpful information and dry humor
- When someone asks obvious questions, respond with gentle sarcasm

RESPONSE GUIDELINES:
- Keep answers concise but complete
- Always be helpful despite the sarcasm
- If you don't know something specific, admit it honestly
- For beer recommendations, check the current tap selection
- Mention relevant promotions or events when appropriate
- Use euros (€) for all prices
- When discussing times, assume Berlin timezone

CONTEXT INFORMATION:
---`;

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
      model: 'gpt-4-turbo-preview',
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