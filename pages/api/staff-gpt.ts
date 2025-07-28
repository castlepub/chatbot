import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getAllFormattedData } from '../../utils/formatData';
import { fetchBeerData, formatBeerDataForGPT } from '../../utils/fetchBeerData';
import { formatReservationDataForStaff } from '../../utils/fetchReservationData';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: 'proj_sbPfzENXvsKlbcCtkOgQwZ3k'
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StaffChatRequest {
  message: string;
  conversation?: ChatMessage[];
  staffKey?: string;
}

export interface StaffChatResponse {
  response: string;
  error?: string;
}

// Staff system prompt with access to detailed reservation data
const STAFF_SYSTEM_PROMPT = `You are The Castle Pub's STAFF assistant, providing detailed operational information for internal use. You have access to complete reservation data, booking details, and operational metrics.

CORE INFORMATION:
- Located at Invalidenstraße 129, 10115 Berlin Mitte
- Self-service pub concept - all orders at the bar
- 20 rotating taps featuring craft and classic beers
- Specializing in home made pizza
- Spacious beer garden for outdoor dining
- Proud sponsors of Berlin Irish Rugby Club

STAFF COMMUNICATION STYLE:
- Professional and direct
- Detailed operational information
- Access to guest names and booking details (when appropriate)
- Specific availability and scheduling data
- Helpful with staff operations and planning

STAFF RESPONSE GUIDELINES:
1. Reservation Management:
   - Provide specific reservation details including names, times, and party sizes
   - Give accurate room availability and booking status
   - Help with scheduling and capacity planning
   - Mention specific guest requests and special arrangements

2. Operational Information:
   - Daily statistics and booking levels
   - Room utilization and availability
   - Expected busy periods
   - Guest count projections

3. Beer Selection:
   - Detailed current tap selection
   - Inventory considerations
   - Popular selections and recommendations

4. Customer Service Support:
   - Help resolve booking conflicts
   - Provide information for guest inquiries
   - Assist with special requests and arrangements

IMPORTANT: This is for STAFF USE ONLY. Never share guest personal information inappropriately, but provide operational details needed for effective service.`;

// Add this function to fix links in the output
function fixLinks(text: string): string {
  let cleaned = text.replace(/(https?:\/\/[^\s]+?)([.,;!?)\]}\]]+)(?=\s|$)/g, '$1');
  cleaned = cleaned.replace(/(https?:\/\/[^\s]+?)([.,;!?)\]}\]]+)$/g, '$1');
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$2');
  return cleaned;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StaffChatResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      response: '', 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { message, conversation = [], staffKey }: StaffChatRequest = req.body;

    // Basic staff authentication (you might want to improve this)
    const validStaffKey = process.env.STAFF_API_KEY || 'castle-staff-2024';
    if (!staffKey || staffKey !== validStaffKey) {
      return res.status(401).json({
        response: '',
        error: 'Unauthorized. Staff access required.'
      });
    }

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
        error: 'Staff ChatBot temporarily unavailable. Please try again later.'
      });
    }

    // Get customer data (without detailed reservations)
    const customerData = await getAllFormattedData();
    
    // Get detailed staff reservation data
    let staffReservationData = '';
    try {
      staffReservationData = await formatReservationDataForStaff();
    } catch (error) {
      console.error('Failed to fetch staff reservation data:', error);
      staffReservationData = '**STAFF RESERVATIONS:** Data temporarily unavailable.';
    }

    // Get beer data
    let beerData = '';
    try {
      const currentBeers = await fetchBeerData();
      beerData = formatBeerDataForGPT(currentBeers);
    } catch (error) {
      console.error('Failed to fetch beer data:', error);
      beerData = 'Beer menu currently unavailable - check physical tap list.';
    }

    // Build the full system prompt with staff context
    const fullSystemPrompt = `${STAFF_SYSTEM_PROMPT}

---

${customerData}

---

${staffReservationData}

---

${beerData}

---

Remember: You're the Castle Staff Assistant - provide detailed operational information to help staff deliver excellent service!`;

    // Prepare conversation history for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
STAFF LINK FORMATTING RULES:

1. NEVER use Markdown formatting for links
2. NEVER add punctuation immediately after a URL
3. Always provide clean, clickable URLs

Use clean URLs like: https://www.castlepub.de/reservemitte
        `.trim()
      },
      {
        role: 'system',
        content: fullSystemPrompt
      }
    ];

    // Add conversation history (limit to last 10 exchanges)
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

    // Call OpenAI GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 600, // Slightly more for detailed staff responses
      temperature: 0.3, // Lower temperature for more factual, consistent responses
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const response = completion.choices[0]?.message?.content || 
      "Sorry, I'm having technical difficulties. Please try again.";

    // Fix links in the response before sending
    const fixedResponse = fixLinks(response);

    // Log staff interactions (with appropriate privacy)
    console.log(`Staff Assistant - Query: ${message.substring(0, 50)}... | Response: ${fixedResponse.substring(0, 50)}...`);

    return res.status(200).json({ response: fixedResponse });

  } catch (error) {
    console.error('Staff Assistant API Error:', error);
    
    let errorMessage = "I'm having technical difficulties. Please try again later.";
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = "Staff system connection error. Please contact IT support.";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "System busy. Please wait a moment and try again.";
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = "Network connectivity issue. Please try again.";
      }
    }

    return res.status(500).json({
      response: '',
      error: errorMessage
    });
  }
} 