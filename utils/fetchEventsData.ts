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
 * This parser looks for Castle Quiz and other events from the website
 */
function parseEventsFromHTML(html: string): any {
  const events: any = {};
  
  try {
    console.log('Parsing events from website HTML...');
    
    // Look for Castle Quiz information
    const quizPatterns = [
      /castle\s*quiz.*?(\d{1,2}:\d{2}|\d{1,2}\s*pm|\d{1,2}\s*am)/gi,
      /quiz.*?monday.*?(\d{1,2}:\d{2}|\d{1,2}\s*pm|\d{1,2}\s*am)/gi,
      /monday.*?quiz.*?(\d{1,2}:\d{2}|\d{1,2}\s*pm|\d{1,2}\s*am)/gi
    ];
    
    let quizTime = "8:00 PM"; // Default fallback
    let quizFound = false;
    
    for (const pattern of quizPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        console.log('Found quiz pattern:', matches[0]);
        // Extract time from the match
        const timeMatch = matches[0].match(/(\d{1,2}:\d{2}|\d{1,2}\s*[ap]m)/i);
        if (timeMatch) {
          quizTime = timeMatch[1];
          quizFound = true;
          console.log('Extracted quiz time:', quizTime);
          break;
        }
      }
    }
    
    // Look for general event patterns
    const eventPatterns = [
      /(?:event|happening|tonight|today|tomorrow).*?(\d{1,2}:\d{2}|\d{1,2}\s*[ap]m)/gi,
      /(\d{1,2}:\d{2}|\d{1,2}\s*[ap]m).*?(?:event|show|match|game)/gi
    ];
    
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
    const currentYear = currentDate.getFullYear();
    
    // Create events for the current period
    const monthKey = `${currentMonth}_${currentYear}`;
    events[monthKey] = {};
    
    // Add Castle Quiz if found or use default
    if (quizFound || true) { // Always include quiz info
      const nextMonday = getNextMonday();
      events[monthKey].castle_quiz = {
        name: "Castle Quiz",
        date: nextMonday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        time: quizTime,
        description: `Weekly pub quiz in English & German${quizFound ? ' (from website)' : ' (check website for current schedule)'}`
      };
      console.log('Added Castle Quiz event:', events[monthKey].castle_quiz);
    }
    
    // Look for specific sports events or special events
    const sportsPatterns = [
      /(?:match|game|euro|champions|football|rugby|sport).*?(\d{1,2}:\d{2}|\d{1,2}\s*[ap]m)/gi,
      /(?:watch|viewing|live).*?(?:match|game).*?(\d{1,2}:\d{2}|\d{1,2}\s*[ap]m)/gi
    ];
    
    let eventCounter = 1;
    for (const pattern of sportsPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        matches.slice(0, 3).forEach(match => { // Limit to 3 events
          const timeMatch = match.match(/(\d{1,2}:\d{2}|\d{1,2}\s*[ap]m)/i);
          if (timeMatch) {
            events[monthKey][`sports_event_${eventCounter}`] = {
              name: "Sports Event",
              date: "Check website for date",
              time: timeMatch[1],
              description: `${match.substring(0, 100)}... (from website)`
            };
            eventCounter++;
          }
        });
      }
    }
    
    console.log(`Parsed ${Object.keys(events[monthKey] || {}).length} events from website`);
    
  } catch (error) {
    console.error('Error parsing events from HTML:', error);
  }
  
  return events;
}

/**
 * Get the next Monday's date
 */
function getNextMonday(): Date {
  const today = new Date();
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7; // 0 = Sunday, 1 = Monday, etc.
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday;
}

/**
 * Get events data - tries to fetch from website first, falls back to static data
 */
export async function getCurrentEventsData(): Promise<EventsData> {
  try {
    console.log('Attempting to fetch events from Castle Pub website...');
    // Try to fetch from website
    const websiteEvents = await fetchEventsFromWebsite();
    
    if (websiteEvents.upcoming_events && Object.keys(websiteEvents.upcoming_events).length > 0) {
      console.log('Successfully fetched events from website');
      
      // Merge website events with static regular features
      const staticEvents = await import('../data/events.json');
      const staticData = staticEvents.default as unknown as EventsData;
      
      return {
        regular_features: staticData.regular_features,
        special_features: staticData.special_features,
        upcoming_events: websiteEvents.upcoming_events,
        venue_info: websiteEvents.venue_info || staticData.venue_info
      } as EventsData;
    }
  } catch (error) {
    console.log('Website events fetch failed, using static data:', error instanceof Error ? error.message : String(error));
  }
  
  // Fallback to static data
  console.log('Using static events data as fallback');
  const staticEvents = await import('../data/events.json');
  return staticEvents.default as unknown as EventsData;
} 