import { getReservationClient, Room, WorkingHours } from './reservationApiClient';

export type ConversationSlots = {
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM (24h)
  party_size?: number;
  room_id?: string | null;
  customer_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  reservation_type?: string; // e.g., 'dining'
};

export type ConversationState = {
  intent: 'reserve' | 'idle';
  slots: ConversationSlots;
  confirmed: boolean;
  lastError?: string;
  requestId?: string;
  lastApiError?: string;
  suggestions?: Array<{ time: string; room_id?: string | null; room_name?: string }>;
};

function toBerlinTime(date: Date): Date {
  const tz = process.env.TZ || 'Europe/Berlin';
  // Keep simple: assume server has correct TZ or user inputs normalized
  return new Date(date.toLocaleString('en-US', { timeZone: tz }));
}

function normalizeTime(input: string): string | null {
  const s = input.trim().toLowerCase();
  // Accept 7pm, 19:00, 19, 7:30 pm etc
  const ampm = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2] ? parseInt(ampm[2], 10) : 0;
    const suffix = ampm[3];
    if (suffix === 'pm' && h < 12) h += 12;
    if (suffix === 'am' && h === 12) h = 0;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const hhmm = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (hhmm) {
    let h = parseInt(hhmm[1], 10);
    const m = hhmm[2] ? parseInt(hhmm[2], 10) : 0;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return null;
}

function normalizeDate(input: string): string | null {
  // Accept YYYY-MM-DD or common text like 'today', 'tomorrow'
  const s = input.trim().toLowerCase();
  const today = toBerlinTime(new Date());
  if (s === 'today') return today.toISOString().slice(0, 10);
  if (s === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

function validateFutureDate(dateStr: string): boolean {
  const now = toBerlinTime(new Date());
  const d = new Date(dateStr + 'T00:00:00');
  return d >= new Date(now.toISOString().slice(0, 10) + 'T00:00:00');
}

function withinSlots(time: string, slots: string[]): boolean {
  return slots.includes(time);
}

export class ConversationManager {
  private client = getReservationClient();
  private slotLengthMinutes = 30; // fallback if API not available

  async start(): Promise<ConversationState> {
    return { intent: 'reserve', slots: {}, confirmed: false };
  }

  async handleInput(state: ConversationState, userInput: string): Promise<{ state: ConversationState; reply: string }> {
    try {
      // Slot collection order
      if (!state.slots.date) {
        const date = normalizeDate(userInput);
        if (!date || !validateFutureDate(date)) {
          return { state, reply: 'Please provide a date (YYYY-MM-DD), today, or tomorrow.' };
        }
        state.slots.date = date;
        return { state, reply: 'Great. What time? (e.g., 19:00 or 7pm)' };
      }

      if (!state.slots.time) {
        const time = normalizeTime(userInput);
        if (!time) {
          return { state, reply: 'Please provide a valid time like 19:00 or 7pm.' };
        }
        // Validate against working hours
        const hours = await this.client.getWorkingHours(state.slots.date);
        const ok = withinSlots(time, hours.slots || []);
        if (!ok) {
          const preview = (hours.slots || []).slice(0, 6).join(', ');
          return { state, reply: `That time isn’t available. Today’s slots include: ${preview}. Pick one of those times.` };
        }
        state.slots.time = time;
        return { state, reply: 'How many people?' };
      }

      if (!state.slots.party_size) {
        const n = parseInt(userInput, 10);
        if (!Number.isFinite(n) || n < 1 || n > 50) {
          return { state, reply: 'Please provide a party size between 1 and 50.' };
        }
        state.slots.party_size = n;
        // Check availability now
        const availability = await this.client.checkAvailability({
          date: state.slots.date,
          time: state.slots.time,
          party_size: state.slots.party_size,
          room_id: state.slots.room_id ?? undefined,
        });
        if (availability.available) {
          const roomsList = availability.rooms.map(r => r.name).join(', ');
          return { state, reply: `We have availability. Any room preference? Options: ${roomsList} (or say 'no preference').` };
        } else {
          state.suggestions = availability.suggestions?.slice(0, 3) || [];
          if (state.suggestions.length > 0) {
            const s = state.suggestions.map(sug => `${sug.time}${sug.room_name ? ' in ' + sug.room_name : ''}`).join(' | ');
            return { state, reply: `That slot isn’t available. Suggestions: ${s}. Pick one or provide another time.` };
          }
          return { state, reply: 'That slot is not available. Please provide another time.' };
        }
      }

      if (state.slots.room_id === undefined) {
        const input = userInput.trim().toLowerCase();
        if (input === 'no preference' || input === 'no' || input === 'none') {
          state.slots.room_id = null;
        } else {
          // Try to match by name
          const rooms = await this.client.getRooms();
          const match = rooms.find(r => r.name.toLowerCase() === input);
          state.slots.room_id = match ? match.id : null;
        }
        return { state, reply: 'Your name?' };
      }

      if (!state.slots.customer_name) {
        const name = userInput.trim();
        if (name.length < 2) return { state, reply: 'Please provide your full name.' };
        state.slots.customer_name = name;
        return { state, reply: 'Your email?' };
      }

      if (!state.slots.email) {
        const email = userInput.trim();
        const ok = /.+@.+\..+/.test(email);
        if (!ok) return { state, reply: 'Please provide a valid email address.' };
        state.slots.email = email;
        return { state, reply: 'Your phone number?' };
      }

      if (!state.slots.phone) {
        const phone = userInput.trim();
        if (phone.length < 5) return { state, reply: 'Please provide a valid phone number.' };
        state.slots.phone = phone;
        return { state, reply: 'Any notes or special requests? (optional). If none, reply "none".' };
      }

      if (!state.slots.notes) {
        const notes = userInput.trim();
        state.slots.notes = notes.toLowerCase() === 'none' ? '' : notes;

        // Confirm details
        const summary = `Please confirm: ${state.slots.date} at ${state.slots.time} for ${state.slots.party_size}.
Name: ${state.slots.customer_name}
Email: ${state.slots.email}
Phone: ${state.slots.phone}
Room: ${state.slots.room_id ? state.slots.room_id : 'No preference'}
Notes: ${state.slots.notes || '—'}
Reply "confirm" to book or say what to change (date/time/party/room).`;
        return { state, reply: summary };
      }

      // Handle confirmation and modifications
      const lower = userInput.trim().toLowerCase();
      if (lower === 'confirm' || lower === 'book') {
        // Create reservation
        const idempotencyKey = (global as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
        const created = await this.client.createReservation(
          {
            customer_name: state.slots.customer_name!,
            email: state.slots.email!,
            phone: state.slots.phone!,
            date: state.slots.date!,
            time: state.slots.time!,
            party_size: state.slots.party_size!,
            reservation_type: state.slots.reservation_type || 'dining',
            notes: state.slots.notes,
            room_id: state.slots.room_id || undefined,
          },
          { idempotencyKey }
        );

        state.confirmed = true;
        const tableNames = created.tables?.map(t => t.table_name).join(', ') || 'Assigned on arrival';
        const finalReply = `✅ Booked! Reservation #${created.id} for ${state.slots.date} at ${state.slots.time}.
Room: ${created.room_name || '—'}
Tables: ${tableNames}
We sent a confirmation to ${state.slots.email}.`;
        return { state, reply: finalReply };
      }

      // Modifications before confirmation
      if (lower.includes('date')) {
        state.slots.date = undefined;
        return { state, reply: 'Sure—what is the new date? (YYYY-MM-DD, today, tomorrow)' };
      }
      if (lower.includes('time')) {
        state.slots.time = undefined;
        return { state, reply: 'Okay—what time?' };
      }
      if (lower.includes('party') || lower.includes('people') || lower.includes('size')) {
        state.slots.party_size = undefined;
        return { state, reply: 'What party size?' };
      }
      if (lower.includes('room')) {
        state.slots.room_id = undefined;
        return { state, reply: 'Which room? Or say "no preference".' };
      }

      return { state, reply: 'Sorry, I did not understand. Reply "confirm" to book, or specify what to change (date/time/party/room).' };
    } catch (err) {
      state.lastApiError = err instanceof Error ? err.message : String(err);
      return { state, reply: "I couldn’t reach the booking system, please try again." };
    }
  }
}
