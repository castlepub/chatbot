// Hours data types
interface HoursData {
  regular_hours: {
    [key: string]: {
      status: string;
      hours?: {
        from: string;
        to: string;
      };
    };
  };
  holiday_hours: {
    [key: string]: {
      date: string;
      status: string;
      hours: {
        from: string;
        to: string;
      };
    };
  };
  notes: string[];
}

// Menu data types
interface MenuItem {
  name: string;
  price: number;
  description?: string;
  dietary?: string[];
  category?: string;
  is_signature?: boolean;
  sizes?: {
    small: { volume: string; price: number };
    large: { volume: string; price: number };
  };
}

interface MenuCategory {
  name: string;
  description?: string;
  items: MenuItem[];
  base_price?: number;
  note?: string;
}

interface MenuData {
  categories: {
    [key: string]: MenuCategory;
  };
  menu_notes: string[];
}

// Drinks data types
interface DrinkSize {
  volume: string;
  price: number;
}

interface DrinkItem {
  name: string;
  price?: number;
  sizes?: {
    small: DrinkSize;
    large: DrinkSize;
  };
  size?: string;
  variants?: string[];
  is_local?: boolean;
  category?: string;
  description?: string;
}

interface DrinkCategory {
  name: string;
  items: DrinkItem[];
  extras?: { name: string; price: number; }[];
}

interface DrinksData {
  categories: {
    [key: string]: DrinkCategory | {
      [key: string]: DrinkCategory;
    };
  };
}

// FAQ data types
interface FAQData {
  general_info: {
    concept: {
      type: string;
      style: string;
      specialties: string[];
    };
  };
  service_info: {
    ordering: {
      process: string;
      payment: string[];
      note: string;
    };
    reservations: {
      policy: string;
      groups: string;
    };
  };
  facilities: {
    seating: {
      indoor: string;
      outdoor: string;
      groups: string;
    };
    features: {
      [key: string]: string;
    };
  };
}

// Events data types
interface EventFeature {
  name: string;
  description: string;
  availability?: string;
  seating?: string;
  note?: string;
  rotation?: string;
  info?: string;
  style?: string;
}

interface EventsData {
  regular_features: {
    [key: string]: EventFeature;
  };
  special_features: {
    [key: string]: EventFeature;
  };
  venue_info: {
    atmosphere: string;
    location: string;
    specialties: string[];
  };
}

// Loyalty data types
interface LoyaltyData {
  program_name: string;
  point_system: {
    earning_rate: string;
    bonus_earning: {
      happy_hour: string;
      quiz_night: string;
      birthday_month: string;
    };
  };
  rewards: {
    [key: string]: {
      points_required: number;
      reward: string;
      description: string;
    };
  };
  membership_tiers: {
    [key: string]: {
      min_points: number;
      benefits: string[];
    };
  };
  api_integration: {
    note: string;
  };
}

declare module "*.json" {
  const hoursData: HoursData;
  const menuData: MenuData;
  const drinksData: DrinksData;
  const faqData: FAQData;
  const eventsData: EventsData;
  const loyaltyData: LoyaltyData;
  export = { hoursData, menuData, drinksData, faqData, eventsData, loyaltyData };
} 