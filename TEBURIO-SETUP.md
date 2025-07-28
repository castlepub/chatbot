# Teburio Integration Setup

This document explains how to set up the automated Teburio integration for fetching live reservation data.

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Teburio Login Credentials
TEBURIO_USERNAME=your-teburio-username@email.com
TEBURIO_PASSWORD=your-teburio-password

# Teburio URLs (adjust these based on your actual Teburio setup)
TEBURIO_LOGIN_URL=https://app.teburio.com/login
TEBURIO_DASHBOARD_URL=https://app.teburio.com/dashboard

# Optional: Disable Teburio scraping for testing
DISABLE_TEBURIO_SCRAPING=false
```

## How It Works

1. **Automated Login**: The system automatically logs into Teburio using your credentials
2. **Data Scraping**: Extracts current reservation data from the dashboard
3. **Fallback**: If scraping fails, falls back to static reservation data
4. **Caching**: Reservation data is cached to avoid excessive scraping

## Setup Steps

### 1. Get Your Teburio Credentials
- Your Teburio login email
- Your Teburio password
- The actual login URL for your Teburio instance

### 2. Update Environment Variables
Create or update your `.env.local` file with the credentials above.

### 3. Customize Selectors (Important!)
The scraper needs to be customized for Teburio's specific HTML structure. You'll need to:

1. **Inspect Teburio's Dashboard**: 
   - Log into Teburio manually
   - Right-click on reservation items and inspect the HTML
   - Note the CSS classes and selectors used

2. **Update Selectors in `utils/teburioScraper.ts`**:
   ```typescript
   // Update these selectors based on Teburio's actual HTML:
   const timeElement = item.querySelector('.actual-time-selector');
   const nameElement = item.querySelector('.actual-name-selector');
   const guestsElement = item.querySelector('.actual-guests-selector');
   ```

### 4. Test the Integration

Run this test script to verify the scraper works:

```bash
# Test the scraper
node -e "
const { fetchTeburioReservations } = require('./utils/teburioScraper.ts');
fetchTeburioReservations().then(console.log);
"
```

## Customization Needed

⚠️ **Important**: The current selectors are generic and need to be customized for your specific Teburio setup.

### Common Elements to Find:
- Reservation time display
- Guest name/contact
- Party size
- Room/table assignment
- Special requests/notes
- Booking status

### Example Customization:
```typescript
// In getTodaysReservations() method:
const reservations = await this.page.evaluate(() => {
  // Update these selectors based on Teburio's actual structure
  const items = document.querySelectorAll('[data-booking-id]'); // Your actual selector
  
  items.forEach((item) => {
    const time = item.querySelector('.booking-time')?.textContent;
    const name = item.querySelector('.guest-name')?.textContent;
    const guests = item.querySelector('.party-size')?.textContent;
    // ... etc
  });
});
```

## Troubleshooting

### Login Issues
- Verify username/password are correct
- Check if Teburio login URL is correct
- Look for CAPTCHA or 2FA requirements

### Scraping Issues
- Check browser console logs
- Verify CSS selectors match Teburio's structure
- Test with headless: false for debugging

### Performance
- Scraping runs when chatbot needs reservation data
- Consider caching results for 5-10 minutes
- Monitor server resources if scraping frequently

## Security Notes

- Keep credentials secure in environment variables
- Don't commit credentials to git
- Consider IP whitelisting if Teburio supports it
- Monitor for rate limiting

## Fallback Behavior

If Teburio scraping fails:
1. Uses static reservation data from `data/reservations.json`
2. Logs error for debugging
3. Chatbot continues to work with limited reservation info

## Manual Alternative

If automated scraping doesn't work, you can:
1. Manually export reservation data from Teburio
2. Update `data/reservations.json` with current data
3. Set `DISABLE_TEBURIO_SCRAPING=true` to use static data only 