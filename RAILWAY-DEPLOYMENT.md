# Railway Deployment with Teburio Integration

## Environment Variables Setup

### 1. Add Variables in Railway Dashboard

Go to your Railway project → **Variables** tab and add:

```bash
# Existing variables (keep these)
OPENAI_API_KEY=your-openai-key
TELEGRAM_BOT_TOKEN=your-telegram-token
TELEGRAM_CHAT_ID=your-chat-id

# New Teburio variables
TEBURIO_USERNAME=your-teburio-email@domain.com
TEBURIO_PASSWORD=your-teburio-password
TEBURIO_LOGIN_URL=https://app.teburio.com/login
TEBURIO_DASHBOARD_URL=https://app.teburio.com/dashboard

# Optional controls
DISABLE_TEBURIO_SCRAPING=false
```

### 2. Railway-Specific Considerations

#### Memory Limits
Puppeteer can be memory-intensive. If you encounter memory issues:

1. **Upgrade Railway Plan**: Consider Pro plan for more memory
2. **Add Memory Limit Variable**:
   ```bash
   NODE_OPTIONS=--max-old-space-size=1024
   ```

#### Timeouts
Railway has request timeouts. For long scraping operations:

1. **Add Timeout Variable**:
   ```bash
   TEBURIO_TIMEOUT=10000
   ```

2. **Consider Background Processing**: For heavy scraping, consider caching results

## Testing the Deployment

### 1. Deploy with Disabled Scraping First
Set `DISABLE_TEBURIO_SCRAPING=true` initially to test basic deployment.

### 2. Enable Scraping Gradually
Once confirmed working:
1. Set `DISABLE_TEBURIO_SCRAPING=false`
2. Monitor Railway logs for any issues
3. Test chatbot reservation queries

### 3. Monitor Performance
Watch Railway metrics for:
- Memory usage spikes during scraping
- Request timeouts
- Error rates

## Troubleshooting Railway Issues

### Memory Errors
```bash
# Error: "JavaScript heap out of memory"
# Solution: Add this variable
NODE_OPTIONS=--max-old-space-size=1024
```

### Timeout Errors
```bash
# Error: "Request timeout"
# Solution: Optimize scraping or cache results
TEBURIO_TIMEOUT=5000
```

### Puppeteer Issues
```bash
# Error: "Browser launch failed"
# Solution: Railway should handle this automatically, but you can try:
PUPPETEER_CACHE_DIR=/tmp/.cache/puppeteer
```

## Performance Optimization

### 1. Caching Strategy
Consider implementing a caching layer:

```javascript
// Cache reservations for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let cachedData = null;
let cacheTime = 0;

export async function getCachedReservations() {
  const now = Date.now();
  
  if (cachedData && (now - cacheTime) < CACHE_TTL) {
    return cachedData;
  }
  
  // Fetch fresh data
  cachedData = await fetchTeburioReservations();
  cacheTime = now;
  
  return cachedData;
}
```

### 2. Background Jobs
For heavy scraping, consider:
- Scheduled background jobs
- Webhook-based updates
- Periodic data sync

## Security Best Practices

### 1. Secure Credentials
- Use Railway's encrypted environment variables
- Never commit credentials to git
- Rotate passwords regularly

### 2. Access Control
- Use least-privilege Teburio account
- Monitor login attempts
- Set up alerts for failed authentications

## Monitoring & Alerts

### 1. Railway Logs
Monitor for:
```bash
# Success patterns
"Successfully logged into Teburio"
"Found X reservations for today"

# Error patterns
"Login failed"
"Failed to scrape reservations"
"Browser launch failed"
```

### 2. Set Up Alerts
Consider Railway's monitoring features for:
- High memory usage
- Frequent errors
- Response time degradation

## Fallback Strategy

The system is designed with fallbacks:

1. **Teburio scraping fails** → Use static reservation data
2. **Login fails** → Log error, continue with backup
3. **Network issues** → Retry 3 times, then fallback

This ensures the chatbot continues working even if Teburio integration has issues.

## Deployment Checklist

- [ ] Add all environment variables to Railway
- [ ] Test with `DISABLE_TEBURIO_SCRAPING=true` first
- [ ] Verify chatbot basic functionality
- [ ] Enable Teburio scraping
- [ ] Test reservation queries
- [ ] Monitor logs for errors
- [ ] Check memory usage
- [ ] Verify fallback behavior

## Need Help?

If you encounter issues:
1. Check Railway logs first
2. Test locally with the same environment variables
3. Use the `test-teburio.js` script for debugging
4. Consider temporarily disabling scraping if blocking deployment 