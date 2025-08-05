import puppeteer from 'puppeteer';

interface CastleEvent {
  name: string;
  date: string;
  time?: string;
  description?: string;
  location?: string;
  type: 'regular' | 'special' | 'sports';
}

/**
 * Castle Pub Events Scraper
 * Fetches current events from https://www.castlepub.de/events
 */
export class CastleEventsScraper {
  private browser: any = null;
  private page: any = null;

  /**
   * Initialize browser
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Starting Castle Events scraper...');
      
      // Launch browser with Railway-optimized settings
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      });

      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      console.log('Browser initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize Castle Events scraper:', error);
      return false;
    }
  }

  /**
   * Scrape events from the Castle Pub events page
   */
  async scrapeEvents(): Promise<CastleEvent[]> {
    try {
      if (!this.page) {
        throw new Error('Scraper not initialized');
      }

      console.log('Navigating to Castle Pub events page...');
      await this.page.goto('https://www.castlepub.de/events', { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Take a screenshot for debugging
      await this.page.screenshot({ path: 'castle-events-debug.png' });
      console.log('📸 Screenshot saved: castle-events-debug.png');

      // Extract events from the page
      const events = await this.page.evaluate(() => {
        const results: CastleEvent[] = [];
        
        // Look for event elements - try multiple selectors
        const eventSelectors = [
          'article', '.event', '.event-item', '.event-card',
          '[data-event]', '.calendar-event', '.upcoming-event',
          'div[class*="event"]', 'div[class*="Event"]'
        ];

        let eventElements: Element[] = [];
        
        for (const selector of eventSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
            eventElements = Array.from(elements);
            break;
          }
        }

        // If no specific event elements found, look for any elements that might contain event info
        if (eventElements.length === 0) {
          console.log('No specific event elements found, looking for general content...');
          
          // Look for elements containing date patterns
          const allElements = document.querySelectorAll('*');
          const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b|\b\d{1,2}\/\d{1,2}\b|\b\d{1,2}\.\d{1,2}\b/;
          
          for (const element of allElements) {
            const text = element.textContent?.trim();
            if (text && datePattern.test(text) && text.length < 200) {
              console.log(`Found potential event element: "${text}"`);
              eventElements.push(element);
            }
          }
        }

        // Process each event element
        eventElements.forEach((element, index) => {
          try {
            const text = element.textContent?.trim() || '';
            const html = element.innerHTML;
            
            console.log(`Processing event ${index + 1}: "${text.substring(0, 100)}..."`);
            
            // Extract event information using various patterns
            const eventInfo = this.extractEventInfo(text, html);
            
            if (eventInfo.name) {
              results.push(eventInfo);
              console.log(`Extracted event: ${eventInfo.name} on ${eventInfo.date}`);
            }
          } catch (error) {
            console.error(`Error processing event ${index + 1}:`, error);
          }
        });

        return results;
      });

      console.log(`Found ${events.length} events`);
      return events;

    } catch (error) {
      console.error('Failed to scrape events:', error);
      return [];
    }
  }

  /**
   * Extract event information from text and HTML
   */
  private extractEventInfo(text: string, html: string): CastleEvent {
    // Date patterns
    const datePatterns = [
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/,
      /\b\d{1,2}\/\d{1,2}\b/,
      /\b\d{1,2}\.\d{1,2}\b/,
      /\b\d{1,2}-\d{1,2}\b/
    ];

    // Time patterns
    const timePatterns = [
      /\b\d{1,2}:\d{2}\s*[AP]M\b/,
      /\b\d{1,2}:\d{2}\b/
    ];

    // Find date
    let date = '';
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        date = match[0];
        break;
      }
    }

    // Find time
    let time = '';
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        time = match[0];
        break;
      }
    }

    // Extract event name (first line or prominent text)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let name = lines[0] || 'Castle Event';
    
    // Clean up the name
    name = name.replace(/^\s*[-•*]\s*/, '').trim();
    
    // Determine event type
    let type: 'regular' | 'special' | 'sports' = 'regular';
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('quiz') || lowerText.includes('castle quiz')) {
      type = 'regular';
    } else if (lowerText.includes('uefa') || lowerText.includes('champions league') || lowerText.includes('football') || lowerText.includes('soccer')) {
      type = 'sports';
    } else if (lowerText.includes('pub talk') || lowerText.includes('special')) {
      type = 'special';
    }

    return {
      name,
      date,
      time,
      type,
      description: text.length > 100 ? text.substring(0, 100) + '...' : text
    };
  }

  /**
   * Clean up browser resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        console.log('Castle Events scraper cleanup completed');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Scrape events with automatic retry
   */
  async scrapeEventsWithRetry(maxRetries: number = 2): Promise<CastleEvent[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Castle Events scraping attempt ${attempt}/${maxRetries}...`);
        
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error(`Initialization failed on attempt ${attempt}`);
        }

        const events = await this.scrapeEvents();
        await this.cleanup();
        
        console.log(`Successfully scraped ${events.length} events`);
        return events;

      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
        await this.cleanup();
        
        if (attempt === maxRetries) {
          console.error('All Castle Events scraping attempts failed.');
          return [];
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return [];
  }
}

/**
 * Singleton instance for the scraper
 */
let scraperInstance: CastleEventsScraper | null = null;

/**
 * Get current events from Castle Pub website
 */
export async function fetchCastleEvents(): Promise<CastleEvent[]> {
  try {
    if (!scraperInstance) {
      scraperInstance = new CastleEventsScraper();
    }

    const events = await scraperInstance.scrapeEventsWithRetry();
    return events;

  } catch (error) {
    console.error('Error fetching Castle events:', error);
    return [];
  }
}

/**
 * Convert scraped events to the format expected by the events.json file
 */
export function convertEventsToJsonFormat(scrapedEvents: CastleEvent[]): any {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // Group events by month
  const eventsByMonth: { [key: string]: any } = {};
  
  scrapedEvents.forEach(event => {
    // Parse the date to determine month
    let month = '';
    let year = currentYear;
    
    if (event.date) {
      // Handle different date formats
      const dateMatch = event.date.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/);
      if (dateMatch) {
        const monthName = dateMatch[1];
        const day = dateMatch[2];
        
        // Map month names to numbers
        const monthMap: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        
        const monthNum = monthMap[monthName];
        if (monthNum) {
          month = `${monthName.toLowerCase()}_${year}`;
          
          // Create event key
          const eventKey = `${event.name.toLowerCase().replace(/\s+/g, '_')}_${monthName.toLowerCase()}${day}`;
          
          // Initialize month if not exists
          if (!eventsByMonth[month]) {
            eventsByMonth[month] = {};
          }
          
          // Add event
          eventsByMonth[month][eventKey] = {
            name: event.name,
            date: `${monthName} ${day}, ${year}`,
            time: event.time || 'TBD',
            description: event.description || `${event.name} at The Castle Pub`,
            type: event.type
          };
        }
      }
    }
  });
  
  return {
    regular_features: {
      beer_garden: {
        name: "Beer Garden",
        description: "Enjoy our spacious beer garden with a great selection of craft beers",
        availability: "Weather permitting",
        seating: "First come, first served"
      },
      sports: {
        name: "Sports Viewing",
        description: "Home of Berlin Irish Rugby Club - watch major rugby matches and other sports",
        note: "Check our social media for match schedules"
      },
      self_service: {
        name: "Self-Service Bar",
        description: "Order at the bar, find a cozy spot, and enjoy!",
        note: "No table service or reservations"
      },
      quiz_night: {
        name: "Castle Quiz",
        description: "Weekly pub quiz in English & German",
        schedule: "Every Monday at 8:00 PM (20:00)",
        note: "Great fun for groups and individuals"
      }
    },
    special_features: {
      craft_beer: {
        name: "Craft Beer Selection",
        description: "20 taps featuring local and international craft beers",
        rotation: "Regular rotation of new beers",
        info: "Check Untappd for current selection"
      },
      pizza: {
        name: "Neapolitan Pizza",
        description: "Authentic Italian pizza made fresh to order",
        style: "Traditional Neapolitan style"
      }
    },
    upcoming_events: eventsByMonth,
    venue_info: {
      atmosphere: "Casual, friendly neighborhood pub",
      location: "Heart of Berlin Mitte",
      specialties: ["Craft Beer", "Neapolitan Pizza", "Sports Viewing", "Beer Garden", "Quiz Nights"],
      events_page: "https://www.castlepub.de/events"
    },
    last_updated: new Date().toISOString(),
    updated_by: "castle_events_scraper"
  };
} 