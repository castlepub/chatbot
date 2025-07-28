const puppeteer = require('puppeteer');

/**
 * Test script to help customize Teburio selectors
 * Run with: node test-teburio.js
 */
async function testTeburioScraper() {
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true once working
    slowMo: 1000 // Slow down for debugging
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing Teburio integration...');
    
    // Navigate to Teburio login
    const loginUrl = process.env.TEBURIO_LOGIN_URL || 'https://app.teburio.com/login';
    console.log(`📍 Going to: ${loginUrl}`);
    
    await page.goto(loginUrl, { waitUntil: 'networkidle2' });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'teburio-login.png' });
    console.log('📸 Screenshot saved: teburio-login.png');
    
    // Try to find login form elements
    console.log('🔍 Looking for login form elements...');
    
    const emailSelectors = [
      'input[type="email"]',
      'input[name="username"]', 
      'input[name="email"]',
      'input[id="email"]',
      'input[id="username"]',
      '#email',
      '#username',
      '.email-input',
      '.username-input'
    ];
    
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
      '#password',
      '.password-input'
    ];
    
    let emailField = null;
    let passwordField = null;
    
    // Find email field
    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        emailField = selector;
        console.log(`✅ Found email field: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Find password field
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        passwordField = selector;
        console.log(`✅ Found password field: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!emailField || !passwordField) {
      console.log('❌ Could not find login fields. Manual inspection needed.');
      console.log('📖 Instructions:');
      console.log('1. Look at teburio-login.png');
      console.log('2. Inspect the login form elements');
      console.log('3. Update the selectors in utils/teburioScraper.ts');
      
      // Wait 10 seconds to manually inspect
      console.log('⏳ Waiting 10 seconds for manual inspection...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      await browser.close();
      return;
    }
    
    // Try to login (only if credentials are provided)
    const username = process.env.TEBURIO_USERNAME;
    const password = process.env.TEBURIO_PASSWORD;
    
    if (!username || !password) {
      console.log('⚠️  No credentials provided. Set TEBURIO_USERNAME and TEBURIO_PASSWORD');
      await browser.close();
      return;
    }
    
    console.log('🔑 Attempting login...');
    await page.type(emailField, username);
    await page.type(passwordField, password);
    
    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]', 
      '.login-button',
      '.submit-button',
      'button:contains("Login")',
      'button:contains("Sign in")'
    ];
    
    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        await page.click(selector);
        submitted = true;
        console.log(`✅ Clicked submit button: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!submitted) {
      console.log('❌ Could not find submit button');
      await browser.close();
      return;
    }
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'teburio-dashboard.png' });
    console.log('📸 Dashboard screenshot: teburio-dashboard.png');
    
    // Look for reservation elements
    console.log('🔍 Looking for reservation elements...');
    
    const reservationSelectors = [
      '.reservation',
      '.booking',
      '.reservation-item',
      '.booking-item',
      '[data-reservation]',
      '[data-booking]',
      '.table-row',
      '.appointment',
      '.event'
    ];
    
    for (const selector of reservationSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
        
        // Get sample content
        const sampleText = await page.evaluate((sel) => {
          const elem = document.querySelector(sel);
          return elem ? elem.textContent?.substring(0, 100) : '';
        }, selector);
        
        console.log(`📝 Sample content: ${sampleText}`);
      }
    }
    
    // Extract all text content for analysis
    const pageText = await page.evaluate(() => document.body.textContent);
    
    // Look for time patterns
    const timePatterns = pageText.match(/\d{1,2}:\d{2}/g) || [];
    if (timePatterns.length > 0) {
      console.log(`🕐 Found time patterns: ${timePatterns.slice(0, 5).join(', ')}`);
    }
    
    // Look for number patterns (guest counts)
    const numberPatterns = pageText.match(/\b\d{1,2}\s*(people|guests|pax|persons)\b/gi) || [];
    if (numberPatterns.length > 0) {
      console.log(`👥 Found guest patterns: ${numberPatterns.slice(0, 5).join(', ')}`);
    }
    
    console.log('✅ Teburio test completed!');
    console.log('📋 Next steps:');
    console.log('1. Review teburio-dashboard.png');
    console.log('2. Update selectors in utils/teburioScraper.ts');
    console.log('3. Test with the actual scraper');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testTeburioScraper().catch(console.error); 