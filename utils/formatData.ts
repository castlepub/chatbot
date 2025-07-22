import menuData from '../data/menu.json';
import hoursData from '../data/hours.json';
import eventsData from '../data/events.json';
import faqData from '../data/faq.json';
import loyaltyData from '../data/loyalty.json';

/**
 * Format menu data for GPT context
 */
export function formatMenuData(): string {
  const { food, cocktails, spirits, beer_info } = menuData;
  
  let formatted = "**MENU INFORMATION:**\n\n";
  
  // Food section
  formatted += "**FOOD MENU:**\n";
  Object.values(food).forEach(item => {
    formatted += `• ${item.name} - ${item.price}\n  ${item.description}\n`;
  });
  
  formatted += "\n**COCKTAILS:**\n";
  Object.values(cocktails).forEach(item => {
    formatted += `• ${item.name} - ${item.price}\n  ${item.description}\n`;
  });
  
  formatted += "\n**SPIRITS:**\n";
  Object.values(spirits).forEach(category => {
    formatted += `• ${category.name}: ${category.options.join(', ')}\n  Price range: ${category.price_range}\n`;
  });
  
  formatted += "\n**BEER INFORMATION:**\n";
  formatted += `• ${beer_info.note}\n`;
  formatted += `• Typical styles: ${beer_info.typical_styles.join(', ')}\n`;
  formatted += `• Price range: ${beer_info.price_range}\n`;
  
  return formatted;
}

/**
 * Format opening hours for GPT context
 */
export function formatHoursData(): string {
  const { opening_hours, kitchen_hours, special_notes } = hoursData;
  
  let formatted = "**OPENING HOURS:**\n\n";
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach((day, index) => {
    const hours = opening_hours[day as keyof typeof opening_hours];
    formatted += `${dayNames[index]}: ${hours.open} - ${hours.close}\n`;
  });
  
  formatted += `\n**KITCHEN HOURS:**\n`;
  formatted += `Daily: ${kitchen_hours.daily.open} - ${kitchen_hours.daily.close}\n`;
  formatted += `Note: ${kitchen_hours.daily.note}\n`;
  
  formatted += `\n**SPECIAL NOTES:**\n`;
  special_notes.forEach(note => {
    formatted += `• ${note}\n`;
  });
  
  return formatted;
}

/**
 * Format events data for GPT context
 */
export function formatEventsData(): string {
  const { recurring_events, special_events, event_booking } = eventsData;
  
  let formatted = "**EVENTS & ENTERTAINMENT:**\n\n";
  
  formatted += "**RECURRING EVENTS:**\n";
  Object.values(recurring_events).forEach(event => {
    if (Array.isArray((event as any).days)) {
      formatted += `• ${event.name}: ${(event as any).days.join(', ')}\n`;
    } else {
      formatted += `• ${event.name}: ${(event as any).day} at ${(event as any).time}\n`;
    }
    formatted += `  ${event.description}\n`;
    if ((event as any).prize) formatted += `  Prize: ${(event as any).prize}\n`;
    if ((event as any).note) formatted += `  ${(event as any).note}\n`;
    formatted += "\n";
  });
  
  formatted += "**SPECIAL EVENTS:**\n";
  special_events.forEach(event => {
    formatted += `• ${event.name}\n`;
    formatted += `  Date: ${event.date}\n`;
    if (event.time) formatted += `  Time: ${event.time}\n`;
    formatted += `  ${event.description}\n`;
    if (event.advance_booking) formatted += `  Advance booking required\n`;
    formatted += "\n";
  });
  
  formatted += "**EVENT BOOKING:**\n";
  formatted += `• ${event_booking.policy}\n`;
  formatted += `• ${event_booking.contact}\n`;
  
  return formatted;
}

/**
 * Format FAQ data for GPT context
 */
export function formatFAQData(): string {
  const { house_rules, facilities, payment, reservations, location_info } = faqData;
  
  let formatted = "**POLICIES & INFORMATION:**\n\n";
  
  formatted += "**HOUSE RULES:**\n";
  formatted += `• Pets: ${house_rules.pets.allowed ? 'Welcome!' : 'Not allowed'} ${house_rules.pets.policy}\n`;
  if (house_rules.pets.restrictions) formatted += `  Restriction: ${house_rules.pets.restrictions}\n`;
  formatted += `• Smoking: ${house_rules.smoking.policy}\n`;
  formatted += `• Age: ${house_rules.age_restrictions.policy}\n`;
  formatted += `• Dress Code: ${house_rules.dress_code.policy}\n`;
  
  formatted += "\n**FACILITIES:**\n";
  formatted += `• WiFi: ${facilities.wifi.available ? `Available - Network: ${facilities.wifi.network}` : 'Not available'}\n`;
  formatted += `• Beer Garden: ${facilities.beer_garden.available ? `Yes - ${facilities.beer_garden.capacity}, ${facilities.beer_garden.heating}` : 'Not available'}\n`;
  formatted += `• Accessibility: ${facilities.accessibility.wheelchair_access ? 'Wheelchair accessible' : 'Not wheelchair accessible'}\n`;
  
  formatted += "\n**PAYMENT & RESERVATIONS:**\n";
  formatted += `• Payment methods: ${payment.methods.join(', ')}\n`;
  formatted += `• Card minimum: ${payment.minimum_card}\n`;
  formatted += `• Reservations: ${reservations.policy}\n`;
  formatted += `• Large groups: ${reservations.large_groups}\n`;
  
  formatted += "\n**LOCATION:**\n";
  formatted += `• Address: ${location_info.address}\n`;
  formatted += `• Transport: ${location_info.nearest_transport}\n`;
  formatted += `• Parking: ${location_info.parking}\n`;
  
  return formatted;
}

/**
 * Format loyalty program data for GPT context
 */
export function formatLoyaltyData(): string {
  const { program_name, point_system, rewards, membership_tiers, api_integration } = loyaltyData;
  
  let formatted = `**${program_name.toUpperCase()}:**\n\n`;
  
  formatted += "**POINT SYSTEM:**\n";
  formatted += `• Earning: ${point_system.earning_rate}\n`;
  formatted += `• Happy Hour Bonus: ${point_system.bonus_earning.happy_hour}\n`;
  formatted += `• Quiz Night Bonus: ${point_system.bonus_earning.quiz_night}\n`;
  formatted += `• Birthday Bonus: ${point_system.bonus_earning.birthday_month}\n`;
  
  formatted += "\n**REWARDS:**\n";
  Object.values(rewards).forEach(reward => {
    formatted += `• ${reward.reward} (${reward.points_required} points)\n`;
    formatted += `  ${reward.description}\n`;
  });
  
  formatted += "\n**MEMBERSHIP TIERS:**\n";
  Object.entries(membership_tiers).forEach(([tier, info]) => {
    formatted += `• ${tier.toUpperCase()} (${info.min_points}+ points):\n`;
    info.benefits.forEach(benefit => {
      formatted += `  - ${benefit}\n`;
    });
  });
  
  formatted += "\n**IMPORTANT NOTE:**\n";
  formatted += `${api_integration.note}\n`;
  
  return formatted;
}

/**
 * Get current day and time information for context
 */
export function getCurrentTimeContext(): string {
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Berlin"}));
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[berlinTime.getDay()];
  const currentTime = berlinTime.toTimeString().slice(0, 5);
  
  const { opening_hours } = hoursData;
  const todayHours = opening_hours[dayName as keyof typeof opening_hours];
  
  let status = 'closed';
  if (todayHours) {
    const openTime = parseInt(todayHours.open.replace(':', ''));
    const closeTime = parseInt(todayHours.close.replace(':', ''));
    const currentTimeNum = parseInt(currentTime.replace(':', ''));
    
    // Handle overnight closing (close time is next day)
    if (closeTime < openTime) {
      status = (currentTimeNum >= openTime || currentTimeNum <= closeTime) ? 'open' : 'closed';
    } else {
      status = (currentTimeNum >= openTime && currentTimeNum <= closeTime) ? 'open' : 'closed';
    }
  }
  
  return `**CURRENT CONTEXT:**\nDay: ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}\nTime: ${currentTime} (Berlin time)\nStatus: Currently ${status}\nToday's hours: ${todayHours?.open} - ${todayHours?.close}`;
}

/**
 * Combine all data for GPT system prompt
 */
export function getAllFormattedData(): string {
  return [
    getCurrentTimeContext(),
    formatHoursData(),
    formatMenuData(),
    formatEventsData(),
    formatFAQData(),
    formatLoyaltyData()
  ].join('\n\n---\n\n');
} 