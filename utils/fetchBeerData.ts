import axios from 'axios';

export interface BeerData {
  id: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  ibu?: number;
  price: string;
  description?: string;
  available: boolean;
  tap_number?: number;
}

export interface BeerResponse {
  beers: BeerData[];
  last_updated: string;
  total_taps: number;
}

// Cache for beer data to avoid excessive API calls
let beerCache: BeerResponse | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches current beer menu from Railway beer API
 * Includes caching to reduce API calls
 */
export async function fetchBeerData(): Promise<BeerResponse> {
  const now = Date.now();
  
  // Return cached data if still fresh
  if (beerCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return beerCache;
  }

  try {
    const beerApiUrl = process.env.BEER_API_URL;
    
    if (!beerApiUrl) {
      console.warn('BEER_API_URL not configured, returning fallback data');
      return getFallbackBeerData();
    }

    const response = await axios.get(beerApiUrl, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Castle-Concierge-Bot/1.0'
      }
    });

    let data = response.data;
    // If the API returns an array, wrap it in an object
    if (Array.isArray(data)) {
      data = { beers: data, last_updated: new Date().toISOString() };
    }

    // Update cache
    beerCache = data;
    cacheTimestamp = now;
    
    return data;
    
  } catch (error) {
    console.error('Failed to fetch beer data from Railway API:', error);
    
    // Return cached data if available, otherwise fallback
    if (beerCache) {
      console.log('Returning cached beer data due to API error');
      return beerCache;
    }
    
    return getFallbackBeerData();
  }
}

/**
 * Fallback beer data when API is unavailable
 */
function getFallbackBeerData(): BeerResponse {
  return {
    beers: [
      {
        id: 'tap-1',
        name: 'Castle IPA',
        brewery: 'Local Brewery',
        style: 'IPA',
        abv: 6.2,
        ibu: 65,
        price: '€6.50',
        description: 'Hoppy India Pale Ale with citrus notes',
        available: true,
        tap_number: 1
      },
      {
        id: 'tap-2', 
        name: 'Berlin Pils',
        brewery: 'Berliner Brauerei',
        style: 'Pilsner',
        abv: 4.8,
        ibu: 25,
        price: '€5.50',
        description: 'Crisp German pilsner with floral hops',
        available: true,
        tap_number: 2
      },
      {
        id: 'tap-3',
        name: 'Wheat Wonder',
        brewery: 'Castle Brewing',
        style: 'Wheat Beer',
        abv: 5.1,
        ibu: 15,
        price: '€6.00',
        description: 'Smooth wheat beer with banana and clove notes',
        available: true,
        tap_number: 3
      },
      {
        id: 'tap-4',
        name: 'Dark Knight Stout',
        brewery: 'Gothic Ales',
        style: 'Stout',
        abv: 7.2,
        ibu: 45,
        price: '€7.50',
        description: 'Rich, creamy stout with coffee and chocolate notes',
        available: true,
        tap_number: 4
      }
    ],
    last_updated: new Date().toISOString(),
    total_taps: 4
  };
}

/**
 * Format beer data for GPT context
 */
export function formatBeerDataForGPT(beerData: BeerResponse): string {
  const availableBeers = beerData.beers.filter(beer => beer.available);
  
  if (availableBeers.length === 0) {
    return "No beers currently available on tap.";
  }

  const beerList = availableBeers.map(beer => {
    const details = [
      `**${beer.name}** by ${beer.brewery}`,
      `Style: ${beer.style}`,
      `ABV: ${beer.abv}%`,
      beer.ibu ? `IBU: ${beer.ibu}` : '',
      `Price: ${beer.price}`,
      beer.description ? `Description: ${beer.description}` : '',
      beer.tap_number ? `Tap #${beer.tap_number}` : ''
    ].filter(Boolean).join(' | ');
    
    return details;
  }).join('\n\n');

  return `**Current Beer Selection (${availableBeers.length} beers on tap):**
Last updated: ${new Date(beerData.last_updated).toLocaleString('en-DE', { timeZone: 'Europe/Berlin' })}

${beerList}`;
}

/**
 * Get beer recommendations based on style preference
 */
export function getBeerRecommendations(beerData: BeerResponse, preferredStyle?: string): BeerData[] {
  const availableBeers = beerData.beers.filter(beer => beer.available);
  
  if (preferredStyle) {
    const styleMatch = availableBeers.filter(beer => 
      beer.style.toLowerCase().includes(preferredStyle.toLowerCase())
    );
    if (styleMatch.length > 0) return styleMatch;
  }
  
  // Return all available if no style preference or no matches
  return availableBeers;
} 