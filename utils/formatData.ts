import type { HoursData, MenuData, DrinksData, FAQData, EventsData, LoyaltyData, MenuItem, DrinkItem, DrinkCategory, EventFeature } from '../types';

// Import JSON files
import menuJson from '../data/menu.json';
import drinksJson from '../data/drinks.json';
import hoursJson from '../data/hours.json';
import eventsJson from '../data/events.json';
import faqJson from '../data/castle_faq.json';
import loyaltyJson from '../data/loyalty.json';

// Cast imported JSON to their types with safety
const menuData = menuJson as unknown as MenuData;
const drinksData = drinksJson as unknown as DrinksData;
const hoursData = hoursJson as unknown as HoursData;
const eventsData = eventsJson as unknown as EventsData;
const faqData = faqJson as unknown as Array<{ question: string; answer: string }>;
const loyaltyData = loyaltyJson as unknown as LoyaltyData;

/**
 * Format menu data for GPT context
 */
export function formatMenuData(): string {
  let formatted = "**MENU INFORMATION:**\n\n";
  
  // Pizza section
  formatted += "**PIZZAS:**\n";
  menuData.categories.pizza.items.forEach((pizza: MenuItem) => {
    if (pizza.price) {
      formatted += `• ${pizza.name} - €${pizza.price.toFixed(2)}${pizza.dietary ? ` (${pizza.dietary.join(', ')})` : ''}\n`;
    }
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
    if (cocktail.price) {
      formatted += `• ${cocktail.name} - €${cocktail.price.toFixed(2)}${cocktail.category === 'non-alcoholic' ? ' (alcohol-free)' : ''}\n`;
    }
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
    if (snack.price) {
      formatted += `• ${snack.name} - €${snack.price.toFixed(2)}${snack.description ? ` (${snack.description})` : ''}\n`;
    }
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
  // Handle both old and new data structures
  const regularHours = (hoursData as any).regular_hours || (hoursData as any).opening_hours;
  const holidayHours = (hoursData as any).holiday_hours || {};
  const notes = (hoursData as any).notes || (hoursData as any).special_notes || [];
  
  let formatted = "**OPENING HOURS:**\n\n";
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach((day, index) => {
    const hours = regularHours[day];
    if (!hours) return;
    
    if (hours.status === 'closed') {
      formatted += `${dayNames[index]}: Closed\n`;
    } else if (hours.hours) {
      // New structure
      formatted += `${dayNames[index]}: ${hours.hours.from} - ${hours.hours.to}\n`;
    } else if (hours.open && hours.close) {
      // Old structure
      formatted += `${dayNames[index]}: ${hours.open} - ${hours.close}\n`;
    }
  });
  
  if (Object.keys(holidayHours).length > 0) {
    formatted += `\n**HOLIDAY HOURS:**\n`;
    Object.entries(holidayHours).forEach(([holiday, info]: [string, any]) => {
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
  // Add safety checks for the data structure
  const events = (eventsData as any).events || [];
  const recurring = (eventsData as any).recurring || [];
  const features = (eventsData as any).features || [];
  
  let formatted = "**UPCOMING EVENTS:**\n\n";
  
  // Regular events
  if (events.length > 0) {
    formatted += "**SPECIAL EVENTS:**\n";
    events.slice(0, 3).forEach((event: any) => {
      formatted += `• ${event.name || 'Event'} - ${event.date || 'TBA'}\n`;
      if (event.description) {
        formatted += `  ${event.description}\n`;
      }
    });
    formatted += "\n";
  }
  
  // Recurring events
  if (recurring.length > 0) {
    formatted += "**REGULAR EVENTS:**\n";
    recurring.forEach((event: any) => {
      formatted += `• ${event.name || 'Regular Event'} - ${event.schedule || 'Check for updates'}\n`;
    });
    formatted += "\n";
  }
  
  // Event features
  if (features.length > 0) {
    formatted += "**EVENT FEATURES:**\n";
    features.forEach((feature: any) => {
      formatted += `• ${feature.name || 'Feature'}: ${feature.description || 'Available'}\n`;
    });
  }
  
  return formatted;
}

/**
 * Format FAQ data for GPT context (castle_faq.json version)
 */
export function formatFAQData(): string {
  if (!Array.isArray(faqData)) return 'No FAQ data available.';
  let formatted = '**FREQUENTLY ASKED QUESTIONS:**\n\n';
  for (const item of faqData) {
    formatted += `**Q:** ${item.question}\n`;
    formatted += `**A:** ${item.answer}\n\n`;
  }
  return formatted.trim();
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
  // Add safety checks for the data structure
  const program = (loyaltyData as any).program || {};
  const benefits = (loyaltyData as any).benefits || [];
  const tiers = (loyaltyData as any).tiers || [];
  
  let formatted = "**LOYALTY PROGRAM:**\n\n";
  
  if (program.name) {
    formatted += `**${program.name.toUpperCase()}:**\n`;
    if (program.description) {
      formatted += `${program.description}\n\n`;
    }
  }
  
  // Benefits
  if (benefits.length > 0) {
    formatted += "**BENEFITS:**\n";
    benefits.forEach((benefit: any) => {
      formatted += `• ${benefit.description || 'Member benefit'}\n`;
    });
    formatted += "\n";
  }
  
  // Tiers
  if (tiers.length > 0) {
    formatted += "**MEMBERSHIP TIERS:**\n";
    tiers.forEach((tier: any) => {
      formatted += `• ${tier.name || 'Tier'}: ${tier.requirements || 'Requirements vary'}\n`;
    });
  }
  
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
  
  // Handle both old and new data structures
  const regularHours = (hoursData as any).regular_hours || (hoursData as any).opening_hours;
  const todayHours = regularHours[dayName];
  
  if (!todayHours) {
    return `**CURRENT CONTEXT:**\nDay: ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}\nTime: ${currentTime} (Berlin time)\nToday's hours: Check at venue`;
  }
  
  let hoursString = todayHours.status === 'closed' ? 'Closed today' : 
    todayHours.hours ? `${todayHours.hours.from}-${todayHours.hours.to}` : 
    todayHours.open && todayHours.close ? `${todayHours.open}-${todayHours.close}` :
    'Check at venue';
  
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