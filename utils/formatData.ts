import menuData from '../data/menu.json';
import hoursData from '../data/hours.json';
import eventsData from '../data/events.json';
import faqData from '../data/faq.json';
import loyaltyData from '../data/loyalty.json';

/**
 * Format menu data for GPT context
 */
export function formatMenuData(): string {
  const { concept, food, beer, location } = menuData;
  
  let formatted = "**MENU INFORMATION:**\n\n";
  
  // Concept section
  formatted += "**CONCEPT:**\n";
  formatted += `• Type: ${concept.type}\n`;
  formatted += `• Specialties: ${concept.specialties.join(', ')}\n`;
  formatted += `• Service Style: ${concept.service_style}\n\n`;
  
  // Food section
  formatted += "**FOOD:**\n";
  formatted += `• Specialty: ${food.specialty}\n`;
  formatted += `• Style: ${food.style}\n`;
  formatted += `• ${food.note}\n\n`;
  
  // Beer section
  formatted += "**BEER:**\n";
  formatted += `• Number of Taps: ${beer.taps.count}\n`;
  formatted += `• Beer Styles: ${beer.taps.styles.join(', ')}\n`;
  formatted += `• ${beer.taps.note}\n\n`;
  
  // Location section
  formatted += "**LOCATION:**\n";
  formatted += `• Address: ${location.address}\n`;
  formatted += `• Area: ${location.area}\n`;
  formatted += `• Features: ${location.features.join(', ')}\n`;
  
  return formatted;
}

/**
 * Format opening hours for GPT context
 */
export function formatHoursData(): string {
  const { opening_hours, special_notes } = hoursData;
  
  let formatted = "**OPENING HOURS:**\n\n";
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach((day, index) => {
    const hours = opening_hours[day as keyof typeof opening_hours];
    if (hours.status === 'closed') {
      formatted += `${dayNames[index]}: Closed\n`;
    } else if ('open' in hours && 'close' in hours) {
      formatted += `${dayNames[index]}: ${hours.open} - ${hours.close}\n`;
    }
  });
  
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
  const { regular_features, special_features, venue_info } = eventsData;
  
  let formatted = "**VENUE FEATURES & INFORMATION:**\n\n";
  
  formatted += "**REGULAR FEATURES:**\n";
  Object.entries(regular_features).forEach(([key, feature]) => {
    formatted += `• ${feature.name}\n`;
    formatted += `  ${feature.description}\n`;
    if ('availability' in feature) formatted += `  Availability: ${feature.availability}\n`;
    if ('seating' in feature) formatted += `  Seating: ${feature.seating}\n`;
    if ('note' in feature) formatted += `  Note: ${feature.note}\n`;
    formatted += "\n";
  });
  
  formatted += "**SPECIAL FEATURES:**\n";
  Object.entries(special_features).forEach(([key, feature]) => {
    formatted += `• ${feature.name}\n`;
    formatted += `  ${feature.description}\n`;
    if ('rotation' in feature) formatted += `  ${feature.rotation}\n`;
    if ('info' in feature) formatted += `  ${feature.info}\n`;
    if ('style' in feature) formatted += `  Style: ${feature.style}\n`;
    formatted += "\n";
  });
  
  formatted += "**VENUE INFORMATION:**\n";
  formatted += `• Atmosphere: ${venue_info.atmosphere}\n`;
  formatted += `• Location: ${venue_info.location}\n`;
  formatted += `• Specialties: ${venue_info.specialties.join(', ')}\n`;
  
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
  
  let status = todayHours.status;
  let hoursString = todayHours.status === 'closed' ? 'Closed' : 
                    ('open' in todayHours && 'close' in todayHours) ? 
                    `${todayHours.open} - ${todayHours.close}` : 'Check at venue';
  
  return `**CURRENT CONTEXT:**\nDay: ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}\nTime: ${currentTime} (Berlin time)\nStatus: Currently ${status}\nToday's hours: ${hoursString}`;
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