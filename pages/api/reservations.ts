import type { NextApiRequest, NextApiResponse } from 'next';
import { ConversationManager, ConversationState } from '../../utils/conversationManager';

// In-memory session map (replace with redis if needed)
const sessions = new Map<string, ConversationState>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, message } = req.body || {};
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    let state = sessions.get(sessionId);
    const cm = new ConversationManager();

    if (!state) {
      state = await cm.start();
    }

    const { state: newState, reply } = await cm.handleInput(state, message);
    sessions.set(sessionId, newState);

    return res.status(200).json({ reply, state: newState });
  } catch (error) {
    console.error('Reservations chat error:', error);
    return res.status(500).json({ error: "I couldn’t reach the booking system, please try again." });
  }
}
