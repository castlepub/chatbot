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
  // Check if scraping is disabled
  if (process.env.DISABLE_TEBURIO_SCRAPING === 'true') {
    console.log('Teburio scraping is disabled via environment variable');
    return getReservationData();
  }
  
  try {
    // Try to fetch from Teburio first
    const { fetchTeburioReservations, convertTeburioToInternalFormat } = await import('./teburioScraper');
    console.log('Attempting to fetch reservations from Teburio...');
    
    const teburioData = await fetchTeburioReservations();
    
    if (teburioData.length > 0) {
      console.log('Successfully fetched live reservation data from Teburio');
      return convertTeburioToInternalFormat(teburioData);
    } else {
      console.log('No reservations returned from Teburio, using fallback data');
    }
      } catch (error) {
      console.log('Failed to fetch from Teburio, using static data:', error instanceof Error ? error.message : String(error));
  }
  
  // Fallback to static data
  return getReservationData();
}

/**
 * Format reservation data for customer-facing GPT context (privacy-safe)
 */
export async function formatReservationDataForCustomers(): Promise<string> {
  const data = await getLiveReservationData();
  
  // Check if we have real data from Teburio
  if (data.last_updated === 'never' || data.updated_by === 'none') {
    return "**CURRENT AVAILABILITY:**\n\nReservation system is currently unavailable. For current availability and bookings, please contact staff directly or visit https://www.castlepub.de/reservemitte\n";
  }
  
  let formatted = "**CURRENT AVAILABILITY:**\n\n";
  
  // Room availability (customer-friendly)
  formatted += "**ROOM AVAILABILITY:**\n";
  Object.entries(data.room_availability).forEach(([room, availability]) => {
    const roomName = room.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    formatted += `• ${roomName} (${availability.capacity} capacity): `;
    
    if (availability.next_available === 'unknown') {
      formatted += `Check with staff for availability\n`;
    } else if (availability.current_bookings_today === 0) {
      formatted += `Available now - no reservations today\n`;
    } else if (availability.next_available === 'now') {
      formatted += `Available now\n`;
    } else if (availability.next_available === 'Check with staff') {
      formatted += `Limited availability - check with staff\n`;
    } else {
      formatted += `Next available at ${availability.next_available}\n`;
    }
  });
  
  // General availability info
  if (data.daily_stats?.today && data.daily_stats.today.busiest_time !== 'unknown') {
    const totalReservations = data.daily_stats.today.total_reservations;
    const busyLevel = totalReservations === 0 ? 'quiet' : 
                     totalReservations <= 2 ? 'moderate' : 'busy';
    
    formatted += `\n**TODAY'S STATUS:**\n`;
    formatted += `• Current booking level: ${busyLevel}\n`;
    
    if (data.daily_stats.today.busiest_time && data.daily_stats.today.busiest_time !== 'Check dashboard') {
      formatted += `• Busiest expected time: ${data.daily_stats.today.busiest_time}\n`;
    }
  }
  
  formatted += `\n**NOTE:** For specific reservations or guaranteed seating, visit https://www.castlepub.de/reservemitte\n`;
  
  return formatted;
}

/**
 * Format detailed reservation data for staff-facing GPT context
 */
export async function formatReservationDataForStaff(): Promise<string> {
  const data = await getLiveReservationData();
  
  // Check if we have real data from Teburio
  if (data.last_updated === 'never' || data.updated_by === 'none') {
    return "**STAFF RESERVATION OVERVIEW:**\n\nI don't have access to current reservation data. The Teburio system connection is not working. Please check the reservation system directly or contact IT support.\n\n**AVAILABLE ROOM CAPACITIES:**\n• Middle Room: 50 capacity\n• Back Room: 30 capacity\n• Front Room: 30 capacity\n• Beer Garden: 50 capacity\n";
  }
  
  const today = new Date().toISOString().split('T')[0];
  const todaysReservations = data.current_reservations[today] || [];
  
  let formatted = "**STAFF RESERVATION OVERVIEW:**\n\n";
  
  // Today's reservations (detailed for staff)
  if (todaysReservations.length > 0) {
    formatted += "**TODAY'S RESERVATIONS:**\n";
    todaysReservations.forEach(res => {
      formatted += `• ${res.time} - ${res.party_size} guests in ${res.room}`;
      if (res.name && res.name !== 'Private') {
        formatted += ` (${res.name})`;
      }
      if (res.special_requests) {
        formatted += ` - ${res.special_requests}`;
      }
      formatted += `\n`;
    });
    formatted += "\n";
  } else {
    formatted += "**TODAY'S RESERVATIONS:** No reservations scheduled\n\n";
  }
  
  // Room availability (detailed for staff)
  formatted += "**ROOM STATUS:**\n";
  Object.entries(data.room_availability).forEach(([room, availability]) => {
    const roomName = room.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    formatted += `• ${roomName}: ${availability.current_bookings_today} booking(s) today, `;
    formatted += `next available: ${availability.next_available}\n`;
  });
  
  // Detailed stats for staff
  if (data.daily_stats?.today) {
    formatted += "\n**DAILY STATISTICS:**\n";
    formatted += `• Total reservations: ${data.daily_stats.today.total_reservations}\n`;
    formatted += `• Total expected guests: ${data.daily_stats.today.total_guests}\n`;
    formatted += `• Busiest time: ${data.daily_stats.today.busiest_time}\n`;
    if (data.daily_stats.today.rooms_booked.length > 0) {
      formatted += `• Rooms with bookings: ${data.daily_stats.today.rooms_booked.join(', ')}\n`;
    }
  }
  
  // Last updated info
  if (data.last_updated !== 'never') {
    const lastUpdated = new Date(data.last_updated).toLocaleString('en-GB', {
      timeZone: 'Europe/Berlin',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    formatted += `\n**Data last updated:** ${lastUpdated}\n`;
  }
  
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