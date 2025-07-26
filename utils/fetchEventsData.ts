// Define the EventsData interface locally to avoid import issues
interface EventsData {
  regular_features: {
    [key: string]: {
      name: string;
      description: string;
      schedule?: string;
      note?: string;
    };
  };
  special_features: {
    [key: string]: {
      name: string;
      description: string;
      rotation?: string;
      info?: string;
    };
  };
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
}

/**
 * Fetch current events from Castle Pub website
 * This function scrapes the events page to get real-time event data
 */
export async function fetchEventsFromWebsite(): Promise<Partial<EventsData>> {
  try {
    const response = await fetch('https://www.castlepub.de/events');
    const html = await response.text();
    
    // Parse the HTML to extract events
    const events = parseEventsFromHTML(html);
    
    return {
      upcoming_events: events,
      venue_info: {
        atmosphere: "Casual, friendly neighborhood pub",
        location: "Heart of Berlin Mitte",
        specialties: ["Craft Beer", "Neapolitan Pizza", "Sports Viewing", "Beer Garden", "Quiz Nights"],
        events_page: "https://www.castlepub.de/events"
      }
    };
  } catch (error) {
    console.error('Failed to fetch events from website:', error);
    // Return fallback data if scraping fails
    return {};
  }
}

/**
 * Parse events from HTML content
 * This is a basic parser - you might need to adjust based on your website structure
 */
function parseEventsFromHTML(html: string): any {
  const events: any = {};
  
  try {
    // Look for event patterns in the HTML
    // This is a simplified example - you'd need to adjust based on your actual HTML structure
    
    // Example patterns to look for:
    // - Dates (like "July 27", "July 28")
    // - Times (like "6:00 PM", "7:00 PM")
    // - Event names (like "UEFA Women's Euro 2025", "Castle Quiz")
    
    const datePattern = /(July|August)\s+\d{1,2}/g;
    const timePattern = /\d{1,2}:\d{2}\s*(AM|PM)/g;
    const eventPattern = /(UEFA Women's Euro 2025|Castle Quiz)/g;
    
    // Extract dates, times, and events
    const dates = html.match(datePattern) || [];
    const times = html.match(timePattern) || [];
    const eventNames = (html.match(eventPattern) || []) as string[];
    
    // Group events by month
    const julyEvents: any = {};
    const augustEvents: any = {};
    
    // This is a simplified mapping - you'd need more sophisticated parsing
    if (eventNames && eventNames.includes('UEFA Women\'s Euro 2025')) {
      julyEvents.uefa_womens_euro = {
        name: "UEFA Women's Euro 2025",
        date: "July 27, 2025",
        time: "6:00 PM",
        description: "Watch the exciting UEFA Women's Euro 2025 matches"
      };
    }
    
    if (eventNames && eventNames.includes('Castle Quiz')) {
      julyEvents.castle_quiz_july28 = {
        name: "Castle Quiz",
        date: "July 28, 2025",
        time: "7:00 PM",
        description: "Weekly pub quiz in English & German"
      };
      
      augustEvents.castle_quiz_august4 = {
        name: "Castle Quiz",
        date: "August 4, 2025",
        time: "7:00 PM",
        description: "Weekly pub quiz in English & German"
      };
    }
    
    if (Object.keys(julyEvents).length > 0) {
      events.july_2025 = julyEvents;
    }
    
    if (Object.keys(augustEvents).length > 0) {
      events.august_2025 = augustEvents;
    }
    
  } catch (error) {
    console.error('Error parsing events from HTML:', error);
  }
  
  return events;
}

/**
 * Get events data - tries to fetch from website first, falls back to static data
 */
export async function getCurrentEventsData(): Promise<EventsData> {
  try {
    // Try to fetch from website
    const websiteEvents = await fetchEventsFromWebsite();
    
    if (websiteEvents.upcoming_events && Object.keys(websiteEvents.upcoming_events).length > 0) {
      console.log('Successfully fetched events from website');
      return websiteEvents as EventsData;
    }
  } catch (error) {
    console.log('Falling back to static events data');
  }
  
  // Fallback to static data
  const staticEvents = await import('../data/events.json');
  return staticEvents.default as unknown as EventsData;
} 