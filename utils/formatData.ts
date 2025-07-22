import type { HoursData, MenuData, DrinksData, FAQData, EventsData, LoyaltyData, MenuItem, DrinkItem, DrinkCategory, EventFeature } from '../types';

// Import JSON files
import menuJson from '../data/menu.json';
import drinksJson from '../data/drinks.json';
import hoursJson from '../data/hours.json';
import eventsJson from '../data/events.json';
import faqJson from '../data/faq.json';
import loyaltyJson from '../data/loyalty.json';

// Cast imported JSON to their types
const menuData = menuJson as MenuData;
const drinksData = drinksJson as DrinksData;
const hoursData = hoursJson as HoursData;
const eventsData = eventsJson as EventsData;
const faqData = faqJson as FAQData;
const loyaltyData = loyaltyJson as LoyaltyData;

/**
 * Format menu data for GPT context
 */
export function formatMenuData(): string {
  let formatted = "**MENU INFORMATION:**\n\n";
  
  // Pizza section
  formatted += "**PIZZAS:**\n";
  menuData.categories.pizza.items.forEach((pizza: MenuItem) => {
    formatted += `• ${pizza.name} - €${pizza.price.toFixed(2)}${pizza.dietary ? ` (${pizza.dietary.join(', ')})` : ''}\n`;
  });

  // Draft beers section
  formatted += "\n**BEERS ON TAP:**\n";
  menuData.categories.draft_beers.items.forEach((beer: MenuItem) => {
    if (beer.sizes) {
      formatted += `• ${beer.name} - €${beer.sizes.small.price.toFixed(2)} (${beer.sizes.small.volume}) / €${beer.sizes.large.price.toFixed(2)} (${beer.sizes.large.volume})\n`;
    }
  });

  // Cocktails section
  formatted += "\n**COCKTAILS:**\n";
  menuData.categories.cocktails.items.forEach((cocktail: MenuItem) => {
    formatted += `• ${cocktail.name} - €${cocktail.price.toFixed(2)}${cocktail.category === 'non-alcoholic' ? ' (alcohol-free)' : ''}\n`;
  });

  // Long drinks section
  formatted += "\n**LONG DRINKS:**\n";
  const longDrinks = menuData.categories.long_drinks;
  if (longDrinks.base_price) {
    formatted += `All long drinks €${longDrinks.base_price.toFixed(2)}:\n`;
  }
  longDrinks.items.slice(0, 5).forEach((drink: MenuItem) => {
    formatted += `• ${drink.name}\n`;
  });
  formatted += "...and more!\n";

  // Snacks section
  formatted += "\n**SNACKS:**\n";
  menuData.categories.snacks.items.forEach((snack: MenuItem) => {
    formatted += `• ${snack.name} - €${snack.price.toFixed(2)}${snack.description ? ` (${snack.description})` : ''}\n`;
  });

  formatted += "\n**NOTES:**\n";
  menuData.menu_notes.forEach((note: string) => {
    formatted += `• ${note}\n`;
  });

  return formatted;
}

/**
 * Format drinks data for GPT context
 */
export function formatDrinksData(): string {
  let formatted = "**DRINKS MENU:**\n\n";

  // Whiskey section
  formatted += "**WHISKEY:**\n";
  const whiskey = drinksData.categories.whiskey as { [key: string]: DrinkCategory };
  Object.entries(whiskey).forEach(([type, data]) => {
    formatted += `\n${data.name}:\n`;
    data.items.forEach((whiskey: DrinkItem) => {
      if (whiskey.sizes) {
        formatted += `• ${whiskey.name} - €${whiskey.sizes.small.price.toFixed(2)} (${whiskey.sizes.small.volume}) / €${whiskey.sizes.large.price.toFixed(2)} (${whiskey.sizes.large.volume})\n`;
      }
    });
  });

  // Bottled beers section
  formatted += "\n**BOTTLED BEERS:**\n";
  const bottledBeers = drinksData.categories.bottled_beers as DrinkCategory;
  bottledBeers.items.forEach((beer: DrinkItem) => {
    if (beer.price) {
      formatted += `• ${beer.name} - €${beer.price.toFixed(2)}${beer.is_local ? ' (local)' : ''}\n`;
    }
  });

  // Ciders section
  formatted += "\n**CIDERS:**\n";
  const ciders = drinksData.categories.ciders as DrinkCategory;
  ciders.items.forEach((cider: DrinkItem) => {
    if (cider.price && cider.size) {
      formatted += `• ${cider.name} (${cider.size}) - €${cider.price.toFixed(2)}\n`;
      if (cider.variants && cider.variants.length > 0) {
        formatted += `  Flavors: ${cider.variants.join(', ')}\n`;
      }
    }
  });

  // Hot drinks section
  formatted += "\n**HOT DRINKS:**\n";
  const hotDrinks = drinksData.categories.hot_drinks as DrinkCategory;
  hotDrinks.items.forEach((drink: DrinkItem) => {
    if (drink.price) {
      formatted += `• ${drink.name} - €${drink.price.toFixed(2)}\n`;
    }
  });
  if (hotDrinks.extras) {
    formatted += "\nExtras:\n";
    hotDrinks.extras.forEach(extra => {
      formatted += `• ${extra.name} - €${extra.price.toFixed(2)}\n`;
    });
  }

  // Soft drinks section
  formatted += "\n**SOFT DRINKS:**\n";
  const softDrinks = drinksData.categories.soft_drinks as DrinkCategory;
  softDrinks.items.forEach((drink: DrinkItem) => {
    if (drink.price) {
      formatted += `• ${drink.name}${drink.size ? ` (${drink.size})` : ''} - €${drink.price.toFixed(2)}\n`;
    }
  });

  return formatted;
}

/**
 * Format opening hours for GPT context
 */
export function formatHoursData(): string {
  const { regular_hours, holiday_hours, notes } = hoursData;
  
  let formatted = "**OPENING HOURS:**\n\n";
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach((day, index) => {
    const hours = regular_hours[day];
    if (hours.status === 'closed') {
      formatted += `${dayNames[index]}: Closed\n`;
    } else if (hours.hours) {
      formatted += `${dayNames[index]}: ${hours.hours.from} - ${hours.hours.to}\n`;
    }
  });
  
  if (Object.keys(holiday_hours).length > 0) {
    formatted += `\n**HOLIDAY HOURS:**\n`;
    Object.entries(holiday_hours).forEach(([holiday, info]) => {
      formatted += `${info.date}: ${info.hours.from} - ${info.hours.to}\n`;
    });
  }
  
  formatted += `\n**NOTES:**\n`;
  notes.forEach((note: string) => {
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
  Object.entries(regular_features).forEach(([key, feature]: [string, EventFeature]) => {
    formatted += `• ${feature.name}\n`;
    formatted += `  ${feature.description}\n`;
    if (feature.availability) formatted += `  Availability: ${feature.availability}\n`;
    if (feature.seating) formatted += `  Seating: ${feature.seating}\n`;
    if (feature.note) formatted += `  Note: ${feature.note}\n`;
    formatted += "\n";
  });
  
  formatted += "**SPECIAL FEATURES:**\n";
  Object.entries(special_features).forEach(([key, feature]: [string, EventFeature]) => {
    formatted += `• ${feature.name}\n`;
    formatted += `  ${feature.description}\n`;
    if (feature.rotation) formatted += `  ${feature.rotation}\n`;
    if (feature.info) formatted += `  ${feature.info}\n`;
    if (feature.style) formatted += `  Style: ${feature.style}\n`;
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
  
  const { regular_hours } = hoursData;
  const todayHours = regular_hours[dayName as keyof typeof regular_hours];
  
  let hoursString = todayHours.status === 'closed' ? 'Closed today' : 
    todayHours.hours ? `${todayHours.hours.from}-${todayHours.hours.to}` : 'Check at venue';
  
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