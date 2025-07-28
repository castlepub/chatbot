import reservationsJson from '../data/reservations.json';

interface Reservation {
  time: string;
  party_size: number;
  room: string;
  name: string;
  status: string;
  special_requests?: string;
}

interface RoomAvailability {
  capacity: number;
  current_bookings_today: number;
  next_available: string;
}

interface ReservationData {
  current_reservations: { [date: string]: Reservation[] };
  room_availability: { [room: string]: RoomAvailability };
  daily_stats: {
    today: {
      total_reservations: number;
      total_guests: number;
      busiest_time: string;
      rooms_booked: string[];
    };
  };
  last_updated: string;
  updated_by: string;
}

/**
 * Get current reservation data
 */
export function getReservationData(): ReservationData {
  return reservationsJson as ReservationData;
}

/**
 * Get today's reservations
 */
export function getTodaysReservations(): Reservation[] {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const data = getReservationData();
  return data.current_reservations[today] || [];
}

/**
 * Get reservations for a specific date
 */
export function getReservationsForDate(date: string): Reservation[] {
  const data = getReservationData();
  return data.current_reservations[date] || [];
}

/**
 * Check room availability
 */
export function getRoomAvailability(room?: string): RoomAvailability | { [room: string]: RoomAvailability } {
  const data = getReservationData();
  if (room) {
    const roomKey = room.toLowerCase().replace(' ', '_');
    return data.room_availability[roomKey] || null;
  }
  return data.room_availability;
}

/**
 * Get live reservation data from Teburio
 */
export async function getLiveReservationData(): Promise<ReservationData> {
  try {
    // Try to fetch from Teburio first
    const { fetchTeburioReservations, convertTeburioToInternalFormat } = await import('./teburioScraper');
    const teburioData = await fetchTeburioReservations();
    
    if (teburioData.length > 0) {
      console.log('Successfully fetched live reservation data from Teburio');
      return convertTeburioToInternalFormat(teburioData);
    }
  } catch (error) {
    console.log('Failed to fetch from Teburio, using static data:', error);
  }
  
  // Fallback to static data
  return getReservationData();
}

/**
 * Format reservation data for GPT context
 */
export async function formatReservationDataForGPT(): Promise<string> {
  const data = await getLiveReservationData();
  const today = new Date().toISOString().split('T')[0];
  const todaysReservations = data.current_reservations[today] || [];
  
  let formatted = "**CURRENT RESERVATIONS & AVAILABILITY:**\n\n";
  
  // Today's reservations
  if (todaysReservations.length > 0) {
    formatted += "**TODAY'S RESERVATIONS:**\n";
    todaysReservations.forEach(res => {
      formatted += `• ${res.time} - ${res.party_size} guests in ${res.room}`;
      if (res.special_requests) {
        formatted += ` (${res.special_requests})`;
      }
      formatted += `\n`;
    });
    formatted += "\n";
  } else {
    formatted += "**TODAY'S RESERVATIONS:** No reservations currently\n\n";
  }
  
  // Room availability
  formatted += "**ROOM AVAILABILITY:**\n";
  Object.entries(data.room_availability).forEach(([room, availability]) => {
    const roomName = room.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    formatted += `• ${roomName}: `;
    if (availability.next_available === 'now') {
      formatted += `Available now (${availability.capacity} capacity)\n`;
    } else {
      formatted += `Next available at ${availability.next_available} (${availability.capacity} capacity)\n`;
    }
  });
  
  // Daily stats
  if (data.daily_stats?.today) {
    formatted += "\n**TODAY'S OVERVIEW:**\n";
    formatted += `• Total reservations: ${data.daily_stats.today.total_reservations}\n`;
    formatted += `• Total expected guests: ${data.daily_stats.today.total_guests}\n`;
    formatted += `• Busiest time: ${data.daily_stats.today.busiest_time}\n`;
    if (data.daily_stats.today.rooms_booked.length > 0) {
      formatted += `• Rooms with bookings: ${data.daily_stats.today.rooms_booked.join(', ')}\n`;
    }
  }
  
  // Last updated info
  const lastUpdated = new Date(data.last_updated).toLocaleString('en-GB', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  formatted += `\n**Last updated:** ${lastUpdated} by ${data.updated_by}\n`;
  
  return formatted;
}

/**
 * Check if a specific time slot is available
 */
export function checkTimeSlotAvailability(room: string, time: string, date?: string): boolean {
  const checkDate = date || new Date().toISOString().split('T')[0];
  const reservations = getReservationsForDate(checkDate);
  
  // Simple check - you might want to add more sophisticated logic
  const conflictingReservation = reservations.find(res => 
    res.room.toLowerCase() === room.toLowerCase() && 
    res.time === time
  );
  
  return !conflictingReservation;
}

/**
 * Get next available slot for a room
 */
export function getNextAvailableSlot(room: string): string {
  const availability = getRoomAvailability(room) as RoomAvailability;
  return availability?.next_available || 'Check with staff';
} 