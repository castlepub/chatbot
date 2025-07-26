import type { HoursData, MenuData, DrinksData, FAQData, EventsData, LoyaltyData, MenuItem, DrinkItem, DrinkCategory, EventFeature } from '../types';

// Import JSON files
import menuJson from '../data/menu.json';
import drinksJson from '../data/drinks.json';
import hoursJson from '../data/hours.json';
import eventsJson from '../data/events.json';
import faqJson from '../data/castle_faq.json';
import loyaltyJson from '../data/loyalty.json';
import pubInfoJson from '../data/pub_info.json';

// Cast imported JSON to their types with safety
const menuData = menuJson as unknown as MenuData;
const drinksData = drinksJson as unknown as DrinksData;
const hoursData = hoursJson as unknown as HoursData;
const eventsData = eventsJson as unknown as EventsData & {
  upcoming_events?: {
    [key: string]: {
      [key: string]: {
        name: string;
        date: string;
        time: string;
        description: string;
      };
    };
  };
  venue_info: {
    atmosphere: string;
    location: string;
    specialties: string[];
    events_page?: string;
  };
};
const faqData = faqJson as unknown as Array<{ question: string; answer: string }>;
const loyaltyData = loyaltyJson as unknown as LoyaltyData;
const pubInfoData = pubInfoJson as unknown as { 
  facilities: any; 
  contact?: {
    phone?: string;
    email?: string;
    social?: { [key: string]: string };
  };
};

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

  // Add hotel and links at the end
  formatted += "\n**NEARBY HOTEL:**\n";
  formatted += "• Downtown Apartments is located directly above the bar (in Mitte, Berlin).\n";
  formatted += "• Guests of Downtown Apartments receive a 10% discount at The Castle Pub.\n";

  formatted += "\n**USEFUL LINKS:**\n";
  formatted += "• Reserve a table: https://www.castlepub.de/reservemitte\n";
  formatted += "• View the full menu: https://www.castlepub.de/menu\n";

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
      if (info.status === 'closed' || !info.hours) {
        formatted += `${info.date}: Closed\n`;
      } else {
        formatted += `${info.date}: ${info.hours.from} - ${info.hours.to}\n`;
      }
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
export async function formatEventsData(): Promise<string> {
  // Import the dynamic events fetching
  const { getCurrentEventsData } = await import('./fetchEventsData');
  
  // Get current events data (from website or fallback to static)
  const currentEventsData = await getCurrentEventsData();
  
  let formatted = "**EVENTS & FEATURES:**\n\n";
  
  // Regular features
  if (currentEventsData.regular_features) {
    formatted += "**REGULAR FEATURES:**\n";
    Object.entries(currentEventsData.regular_features).forEach(([key, feature]: [string, any]) => {
      formatted += `• ${feature.name}: ${feature.description}\n`;
      if (feature.schedule) {
        formatted += `  Schedule: ${feature.schedule}\n`;
      }
      if (feature.note) {
        formatted += `  Note: ${feature.note}\n`;
      }
    });
    formatted += "\n";
  }
  
  // Special features
  if (currentEventsData.special_features) {
    formatted += "**SPECIAL FEATURES:**\n";
    Object.entries(currentEventsData.special_features).forEach(([key, feature]: [string, any]) => {
      formatted += `• ${feature.name}: ${feature.description}\n`;
      if (feature.rotation) {
        formatted += `  ${feature.rotation}\n`;
      }
      if (feature.info) {
        formatted += `  ${feature.info}\n`;
      }
    });
    formatted += "\n";
  }
  
  // Upcoming events
  if (currentEventsData.upcoming_events) {
    formatted += "**UPCOMING EVENTS:**\n";
    Object.entries(currentEventsData.upcoming_events).forEach(([month, monthEvents]: [string, any]) => {
      Object.entries(monthEvents).forEach(([eventKey, event]: [string, any]) => {
        formatted += `• ${event.name} - ${event.date} at ${event.time}\n`;
        if (event.description) {
          formatted += `  ${event.description}\n`;
        }
        // Add a clear identifier for easy searching
        formatted += `  [EVENT: ${event.name} on ${event.date}]\n`;
      });
    });
    formatted += "\n";
  }
  
  // Venue info
  if (currentEventsData.venue_info) {
    formatted += "**VENUE INFO:**\n";
    formatted += `• Atmosphere: ${currentEventsData.venue_info.atmosphere}\n`;
    formatted += `• Location: ${currentEventsData.venue_info.location}\n`;
    formatted += `• Specialties: ${currentEventsData.venue_info.specialties.join(', ')}\n`;
    if (currentEventsData.venue_info.events_page) {
      formatted += `• Events page: ${currentEventsData.venue_info.events_page}\n`;
    }
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

/**
 * Format facilities data for GPT context
 */
export function formatFacilitiesData(): string {
  const facilities = pubInfoData.facilities;
  if (!facilities) return '**FACILITIES:**\nNo facilities information available.';

  let formatted = '**FACILITIES:**\n\n';

  // Indoor section
  if (facilities.indoor) {
    formatted += '**INDOOR:**\n';
    formatted += `• Available: ${facilities.indoor.available ? 'Yes' : 'No'}\n`;
    if (facilities.indoor.features && facilities.indoor.features.length > 0) {
      formatted += `• Features: ${facilities.indoor.features.join(', ')}\n`;
    }
    formatted += '\n';
  }

  // Outdoor section
  if (facilities.outdoor) {
    formatted += '**OUTDOOR:**\n';
    formatted += `• Available: ${facilities.outdoor.available ? 'Yes' : 'No'}\n`;
    formatted += `• Type: ${facilities.outdoor.type || 'N/A'}\n`;
    formatted += `• Weather dependent: ${facilities.outdoor.weather_dependent ? 'Yes' : 'No'}\n\n`;
  }

  // Accessibility section
  if (facilities.accessibility) {
    formatted += '**ACCESSIBILITY:**\n';
    formatted += `• Wheelchair access: ${facilities.accessibility.wheelchair_access ? 'Yes' : 'No'}\n`;
    if (facilities.accessibility.notes && facilities.accessibility.notes.length > 0) {
      formatted += `• Notes: ${facilities.accessibility.notes.join(', ')}\n`;
    }
    formatted += '\n';
  }

  // Amenities section
  if (facilities.amenities && facilities.amenities.length > 0) {
    formatted += '**AMENITIES:**\n';
    facilities.amenities.forEach((amenity: string) => {
      formatted += `• ${amenity}\n`;
    });
  }

  return formatted.trim();
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
  
  // Get tomorrow's date for event queries
  const tomorrow = new Date(berlinTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Handle both old and new data structures
  const regularHours = (hoursData as any).regular_hours || (hoursData as any).opening_hours;
  const todayHours = regularHours[dayName];
  
  if (!todayHours) {
    return `**CURRENT CONTEXT:**\nDay: ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}\nTime: ${currentTime} (Berlin time)\nToday's hours: Check at venue\nTomorrow: ${tomorrowDate}`;
  }
  
  let hoursString = todayHours.status === 'closed' ? 'Closed today' : 
    todayHours.hours ? `${todayHours.hours.from}-${todayHours.hours.to}` : 
    todayHours.open && todayHours.close ? `${todayHours.open}-${todayHours.close}` :
    'Check at venue';
  
  return `**CURRENT CONTEXT:**\nDay: ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}\nTime: ${currentTime} (Berlin time)\nToday's hours: ${hoursString}\nTomorrow: ${tomorrowDate}`;
}

/**
 * Format contact information for GPT context
 */
export function formatContactData(): string {
  const contact = pubInfoData.contact;
  if (!contact) return '**CONTACT:**\nContact information not available.';

  let formatted = '**CONTACT INFORMATION:**\n\n';
  
  if (contact.phone) {
    formatted += `• Phone: ${contact.phone}\n`;
  }
  
  if (contact.email) {
    formatted += `• Email: ${contact.email}\n`;
  }
  
  if (contact.social) {
    formatted += '\n**SOCIAL MEDIA:**\n';
    Object.entries(contact.social).forEach(([platform, url]: [string, string]) => {
      formatted += `• ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url}\n`;
    });
  }
  
  return formatted.trim();
}

/**
 * Combine all data for GPT system prompt
 */
export async function getAllFormattedData(): Promise<string> {
  const eventsData = await formatEventsData();
  
  return [
    getCurrentTimeContext(),
    formatHoursData(),
    formatMenuData(),
    eventsData,
    formatFAQData(),
    formatContactData(),
    formatLoyaltyData()
  ].join('\n\n---\n\n');
} 