import puppeteer from 'puppeteer';

interface TeburioReservation {
  date: string;
  time: string;
  guests: number;
  name: string;
  room: string;
  phone?: string;
  email?: string;
  notes?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface TeburioCredentials {
  username: string;
  password: string;
  loginUrl: string;
  dashboardUrl: string;
}

/**
 * Automated Teburio scraper class
 */
export class TeburioScraper {
  private credentials: TeburioCredentials;
  private browser: any = null;
  private page: any = null;

  constructor() {
    this.credentials = {
      username: process.env.TEBURIO_USERNAME || '',
      password: process.env.TEBURIO_PASSWORD || '',
      loginUrl: process.env.TEBURIO_LOGIN_URL || 'https://app.teburio.com/login',
      dashboardUrl: process.env.TEBURIO_DASHBOARD_URL || 'https://app.teburio.com/dashboard'
    };
  }

  /**
   * Initialize browser and login to Teburio
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Starting Teburio scraper...');
      
      // Check if scraping is disabled
      if (process.env.DISABLE_TEBURIO_SCRAPING === 'true') {
        console.log('Teburio scraping is disabled');
        return false;
      }
      
      // Launch browser with Railway-optimized settings
      this.browser = await puppeteer.launch({
        headless: true, // Use headless mode
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
      
      // Navigate to login page
      await this.page.goto(this.credentials.loginUrl, { 
        waitUntil: 'networkidle2' 
      });

      // Wait for login form
      await this.page.waitForSelector('input[type="email"], input[name="username"], input[name="email"]', {
        timeout: 10000
      });

      console.log('Logging into Teburio...');
      
      // Fill login form (adjust selectors based on Teburio's actual form)
      const usernameSelector = 'input[type="email"], input[name="username"], input[name="email"]';
      const passwordSelector = 'input[type="password"], input[name="password"]';
      const submitSelector = 'button[type="submit"], input[type="submit"], .login-button';

      await this.page.type(usernameSelector, this.credentials.username);
      await this.page.type(passwordSelector, this.credentials.password);
      
      // Click login button
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2' }),
        this.page.click(submitSelector)
      ]);

      // Check if login was successful
      const currentUrl = this.page.url();
      if (currentUrl.includes('dashboard') || currentUrl.includes('reservations')) {
        console.log('Successfully logged into Teburio');
        return true;
      } else {
        console.error('Login failed - still on login page');
        return false;
      }

    } catch (error) {
      console.error('Failed to initialize Teburio scraper:', error);
      return false;
    }
  }

  /**
   * Scrape today's reservations
   */
  async getTodaysReservations(): Promise<TeburioReservation[]> {
    try {
      if (!this.page) {
        throw new Error('Scraper not initialized');
      }

      // Navigate to reservations page
      await this.page.goto(this.credentials.dashboardUrl, { 
        waitUntil: 'networkidle2' 
      });

      // Wait for reservations to load
      await this.page.waitForSelector('.reservation-item, .booking-item, .reservation, .booking', {
        timeout: 10000
      });

      // Extract reservation data (adjust selectors based on Teburio's actual structure)
      const reservations = await this.page.evaluate(() => {
        const items = document.querySelectorAll('.reservation-item, .booking-item, .reservation, .booking');
        const results: any[] = [];

        items.forEach((item: any) => {
          try {
            // Extract data from each reservation item
            // These selectors need to be adjusted based on Teburio's actual HTML structure
            const timeElement = item.querySelector('.time, .booking-time, [data-time]');
            const nameElement = item.querySelector('.name, .guest-name, .customer-name');
            const guestsElement = item.querySelector('.guests, .party-size, .pax');
            const roomElement = item.querySelector('.room, .table, .area');
            const notesElement = item.querySelector('.notes, .comment, .special-requests');
            const statusElement = item.querySelector('.status, .booking-status');

            if (timeElement && nameElement) {
              results.push({
                time: timeElement.textContent?.trim() || '',
                name: nameElement.textContent?.trim() || '',
                guests: parseInt(guestsElement?.textContent?.trim() || '2'),
                room: roomElement?.textContent?.trim() || 'Main Area',
                notes: notesElement?.textContent?.trim() || '',
                status: statusElement?.textContent?.trim().toLowerCase() || 'confirmed',
                date: new Date().toISOString().split('T')[0] // Today's date
              });
            }
          } catch (error) {
            console.error('Error parsing reservation item:', error);
          }
        });

        return results;
      });

      console.log(`Found ${reservations.length} reservations for today`);
      return reservations;

    } catch (error) {
      console.error('Failed to scrape reservations:', error);
      return [];
    }
  }

  /**
   * Get room availability for today
   */
  async getRoomAvailability(): Promise<any> {
    try {
      if (!this.page) {
        throw new Error('Scraper not initialized');
      }

      // This would need to be customized based on how Teburio displays availability
      const availability = await this.page.evaluate(() => {
        const rooms = {
          'Middle Room': { capacity: 50, booked: 0 },
          'Back Room': { capacity: 30, booked: 0 },
          'Front Room': { capacity: 30, booked: 0 },
          'Beer Garden': { capacity: 50, booked: 0 }
        };

        // Look for availability indicators in the UI
        const availabilityElements = document.querySelectorAll('.room-status, .table-status, .availability');
        
        availabilityElements.forEach((element: any) => {
          // Parse room availability data based on Teburio's structure
          // This is placeholder logic - needs to be customized
        });

        return rooms;
      });

      return availability;

    } catch (error) {
      console.error('Failed to get room availability:', error);
      return {};
    }
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
        console.log('Browser cleanup completed');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get reservations with automatic retry
   */
  async getReservationsWithRetry(maxRetries: number = 3): Promise<TeburioReservation[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to fetch reservations...`);
        
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize');
        }

        const reservations = await this.getTodaysReservations();
        await this.cleanup();
        
        return reservations;

      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        await this.cleanup();
        
        if (attempt === maxRetries) {
          console.error('All attempts failed');
          return [];
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
    
    return [];
  }
}

/**
 * Singleton instance for the scraper
 */
let scraperInstance: TeburioScraper | null = null;

/**
 * Get current reservations from Teburio
 */
export async function fetchTeburioReservations(): Promise<TeburioReservation[]> {
  try {
    if (!scraperInstance) {
      scraperInstance = new TeburioScraper();
    }

    const reservations = await scraperInstance.getReservationsWithRetry();
    return reservations;

  } catch (error) {
    console.error('Error fetching Teburio reservations:', error);
    return [];
  }
}

/**
 * Convert Teburio reservations to our internal format
 */
export function convertTeburioToInternalFormat(teburioReservations: TeburioReservation[]): any {
  const today = new Date().toISOString().split('T')[0];
  const roomStats = {
    'Middle Room': 0,
    'Back Room': 0,
    'Front Room': 0,
    'Beer Garden': 0
  };

  // Convert reservations
  const converted = teburioReservations.map(res => {
    roomStats[res.room as keyof typeof roomStats] = (roomStats[res.room as keyof typeof roomStats] || 0) + 1;
    
    return {
      time: res.time,
      party_size: res.guests,
      room: res.room,
      name: res.name,
      status: res.status,
      special_requests: res.notes
    };
  });

  // Calculate availability
  const roomAvailability = {
    middle_room: {
      capacity: 50,
      current_bookings_today: roomStats['Middle Room'],
      next_available: roomStats['Middle Room'] > 0 ? 'Check with staff' : 'now'
    },
    back_room: {
      capacity: 30,
      current_bookings_today: roomStats['Back Room'],
      next_available: roomStats['Back Room'] > 0 ? 'Check with staff' : 'now'
    },
    front_room: {
      capacity: 30,
      current_bookings_today: roomStats['Front Room'],
      next_available: roomStats['Front Room'] > 0 ? 'Check with staff' : 'now'
    },
    beer_garden: {
      capacity: 50,
      current_bookings_today: roomStats['Beer Garden'],
      next_available: roomStats['Beer Garden'] > 0 ? 'Check with staff' : 'now'
    }
  };

  return {
    current_reservations: {
      [today]: converted
    },
    room_availability: roomAvailability,
    daily_stats: {
      today: {
        total_reservations: converted.length,
        total_guests: converted.reduce((sum, res) => sum + res.party_size, 0),
        busiest_time: 'Check dashboard',
        rooms_booked: Object.keys(roomStats).filter(room => roomStats[room as keyof typeof roomStats] > 0)
      }
    },
    last_updated: new Date().toISOString(),
    updated_by: 'teburio_scraper'
  };
} 