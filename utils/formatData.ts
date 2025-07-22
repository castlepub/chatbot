import menuData from '../data/menu.json';
import hoursData from '../data/hours.json';
import eventsData from '../data/events.json';
import faqData from '../data/faq.json';
import loyaltyData from '../data/loyalty.json';

/**
 * Format menu data for GPT context
 */
export function formatMenuData(): string {
  let formatted = "**MENU INFORMATION:**\n\n";
  
  // Pizza section
  formatted += "**PIZZAS:**\n";
  menuData.pizza.items.forEach(pizza => {
    formatted += `• ${pizza.name} - €${pizza.price.toFixed(2)}${pizza.dietary ? ` (${pizza.dietary})` : ''}\n`;
  });

  // Draft beers section
  formatted += "\n**BEERS ON TAP:**\n";
  menuData.draft_beers.items.forEach(beer => {
    formatted += `• ${beer.name} - €${beer.prices["0.3l"].toFixed(2)} (0.3L) / €${beer.prices["0.5l"].toFixed(2)} (0.5L)\n`;
  });

  // Cocktails section
  formatted += "\n**COCKTAILS:**\n";
  menuData.cocktails.items.forEach(cocktail => {
    formatted += `• ${cocktail.name} - €${cocktail.price.toFixed(2)}\n`;
  });

  // Long drinks section
  formatted += "\n**LONG DRINKS:**\n";
  formatted += `All long drinks €${menuData.long_drinks.price.toFixed(2)}:\n`;
  menuData.long_drinks.items.slice(0, 5).forEach(drink => {
    formatted += `• ${drink}\n`;
  });
  formatted += "...and more!\n";

  // Snacks section
  formatted += "\n**SNACKS:**\n";
  menuData.snacks.items.forEach(snack => {
    formatted += `• ${snack.name} - €${snack.price.toFixed(2)}\n`;
  });

  formatted += "\n**NOTE:** This is a selection of our menu. For our complete selection of beers, spirits, and other drinks, please ask at the bar or check Untappd.\n";
  formatted += "All prices include VAT. Menu items and prices subject to change.\n";

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
  const { general_info, service_info, facilities } = faqData;
  
  let formatted = "**GENERAL INFORMATION:**\n\n";
  
  // General info section
  formatted += "**ABOUT US:**\n";
  formatted += `• Type: ${general_info.concept.type}\n`;
  formatted += `• Style: ${general_info.concept.style}\n`;
  formatted += `• Specialties: ${general_info.concept.specialties.join(', ')}\n\n`;
  
  // Service info section
  formatted += "**SERVICE:**\n";
  formatted += `• Ordering: ${service_info.ordering.process}\n`;
  formatted += `• Payment: ${service_info.ordering.payment.join(', ')}\n`;
  formatted += `• Reservations: ${service_info.reservations.policy}\n`;
  formatted += `• Groups: ${service_info.reservations.groups}\n\n`;
  
  // Facilities section
  formatted += "**FACILITIES:**\n";
  formatted += `• Indoor: ${facilities.seating.indoor}\n`;
  formatted += `• Outdoor: ${facilities.seating.outdoor}\n`;
  formatted += `• Features: ${Object.values(facilities.features).join(', ')}\n`;
  
  return formatted;
}

export function formatFacilitiesData(): string {
  const { facilities } = faqData;
  
  let formatted = "**FACILITIES:**\n\n";
  
  // Seating section
  formatted += "**SEATING:**\n";
  formatted += `• Indoor: ${facilities.seating.indoor}\n`;
  formatted += `• Outdoor: ${facilities.seating.outdoor}\n`;
  formatted += `• Groups: ${facilities.seating.groups}\n\n`;
  
  // Features section
  formatted += "**FEATURES:**\n";
  Object.entries(facilities.features).forEach(([key, value]) => {
    formatted += `• ${key}: ${value}\n`;
  });
  
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
  
  if (todayHours.status === 'closed') {
    return `**CURRENT CONTEXT:**\nDay: ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}\nTime: ${currentTime} (Berlin time)\nToday's hours: Closed today`;
  }
  
  // Now we know it's open and has the full structure
  const openHours = todayHours as {
    open: string;
    close: string;
    status: string;
  };
  
  const hoursString = `${openHours.open}-${openHours.close}`;
  
  return `**CURRENT CONTEXT:**\nDay: ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}\nTime: ${currentTime} (Berlin time)\nToday's hours: ${hoursString}`;
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