const puppeteer = require('puppeteer');
require('dotenv').config({ path: '.env.local' });

/**
 * Debug script to test Teburio login and find the right selectors
 * This will help you customize the scraper for your specific Teburio setup
 */
async function debugTeburioLogin() {
  console.log('🔍 Debugging Teburio Connection...');
  
  const browser = await puppeteer.launch({
    headless: false, // Keep browser visible for debugging
    slowMo: 2000 // Slow down for easier observation
  });
  
  const page = await browser.newPage();
  
  try {
    const username = process.env.TEBURIO_USERNAME;
    const password = process.env.TEBURIO_PASSWORD;
    const loginUrl = process.env.TEBURIO_LOGIN_URL;
    
    if (!username || !password || !loginUrl) {
      console.error('❌ Missing credentials. Please set:');
      console.error('- TEBURIO_USERNAME');
      console.error('- TEBURIO_PASSWORD'); 
      console.error('- TEBURIO_LOGIN_URL');
      return;
    }
    
    console.log('📍 Going to:', loginUrl);
    console.log('👤 Username:', username);
    console.log('🔑 Password:', password.replace(/./g, '*'));
    
    // Navigate to login page
    await page.goto(loginUrl, { waitUntil: 'networkidle2' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'debug-1-login-page.png' });
    console.log('📸 Screenshot: debug-1-login-page.png');
    
    // Find and analyze the login form
    console.log('\n🔍 Analyzing login form...');
    
    const formAnalysis = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      
      return {
        inputs: inputs.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          className: input.className,
          placeholder: input.placeholder
        })),
        buttons: buttons.map(button => ({
          type: button.type,
          className: button.className,
          textContent: button.textContent?.trim(),
          id: button.id
        })),
        url: window.location.href,
        title: document.title
      };
    });
    
    console.log('\n📊 Form Analysis:');
    console.log('URL:', formAnalysis.url);
    console.log('Title:', formAnalysis.title);
    console.log('\nInput fields found:');
    formAnalysis.inputs.forEach((input, i) => {
      console.log(`  ${i + 1}. Type: ${input.type}, Name: ${input.name}, ID: ${input.id}, Class: ${input.className}`);
      if (input.placeholder) console.log(`     Placeholder: ${input.placeholder}`);
    });
    
    console.log('\nButtons found:');
    formAnalysis.buttons.forEach((button, i) => {
      console.log(`  ${i + 1}. Text: "${button.textContent}", Type: ${button.type}, Class: ${button.className}`);
    });
    
    // Try to find email/username field
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[id="email"]',
      'input[id="username"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="username" i]'
    ];
    
    let emailField = null;
    console.log('\n🔍 Looking for email/username field...');
    for (const selector of emailSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          emailField = selector;
          console.log(`✅ Found email field: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Try to find password field
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]'
    ];
    
    let passwordField = null;
    console.log('🔍 Looking for password field...');
    for (const selector of passwordSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          passwordField = selector;
          console.log(`✅ Found password field: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!emailField || !passwordField) {
      console.log('❌ Could not find login fields automatically');
      console.log('👀 Please inspect debug-1-login-page.png and identify the correct selectors');
      
      // Wait for manual inspection
      console.log('⏳ Browser will stay open for 30 seconds for manual inspection...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      await browser.close();
      return;
    }
    
    // Attempt login
    console.log('\n🔑 Attempting login...');
    await page.type(emailField, username);
    await page.type(passwordField, password);
    
    // Take screenshot before clicking submit
    await page.screenshot({ path: 'debug-2-before-submit.png' });
    console.log('📸 Screenshot: debug-2-before-submit.png');
    
    // Find submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Login")',
      'button:contains("Sign in")',
      '.login-button',
      '.submit-button'
    ];
    
    let submitClicked = false;
    for (const selector of submitSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`🖱️ Clicking submit button: ${selector}`);
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
            element.click()
          ]);
          submitClicked = true;
          break;
        }
      } catch (e) {
        console.log(`❌ Failed to click ${selector}:`, e.message);
      }
    }
    
    if (!submitClicked) {
      console.log('❌ Could not find or click submit button');
      await browser.close();
      return;
    }
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'debug-3-after-login.png' });
    console.log('📸 Screenshot: debug-3-after-login.png');
    
    // Analyze the page after login
    const postLoginAnalysis = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.textContent?.substring(0, 500),
        hasLogout: document.querySelector('logout, [href*="logout"], [onclick*="logout"]') !== null,
        hasDashboard: document.body.textContent?.toLowerCase().includes('dashboard'),
        hasReservations: document.body.textContent?.toLowerCase().includes('reservation'),
        hasBookings: document.body.textContent?.toLowerCase().includes('booking')
      };
    });
    
    console.log('\n📊 Post-login Analysis:');
    console.log('URL:', postLoginAnalysis.url);
    console.log('Title:', postLoginAnalysis.title);
    console.log('Has logout button:', postLoginAnalysis.hasLogout);
    console.log('Contains "dashboard":', postLoginAnalysis.hasDashboard);
    console.log('Contains "reservation":', postLoginAnalysis.hasReservations);
    console.log('Contains "booking":', postLoginAnalysis.hasBookings);
    console.log('\nFirst 500 chars of page:', postLoginAnalysis.bodyText);
    
    // Look for reservation-like elements
    console.log('\n🔍 Looking for reservation elements...');
    
    const reservationAnalysis = await page.evaluate(() => {
      const possibleSelectors = [
        'table tr',
        '.reservation',
        '.booking', 
        '.appointment',
        '.event',
        '[data-reservation]',
        '[data-booking]',
        '.calendar-event',
        '.schedule-item'
      ];
      
      const results = {};
      
      possibleSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results[selector] = {
            count: elements.length,
            sampleText: elements[0].textContent?.substring(0, 100)
          };
        }
      });
      
      return results;
    });
    
    console.log('Reservation elements found:');
    Object.entries(reservationAnalysis).forEach(([selector, data]) => {
      console.log(`  ${selector}: ${data.count} elements`);
      console.log(`    Sample: "${data.sampleText}"`);
    });
    
    console.log('\n✅ Debug complete!');
    console.log('📋 Next steps:');
    console.log('1. Review the screenshots (debug-1, debug-2, debug-3)');
    console.log('2. Check if login was successful');
    console.log('3. Identify the correct selectors for reservations');
    console.log('4. Update utils/teburioScraper.ts with the correct selectors');
    
    // Keep browser open for manual inspection
    console.log('\n⏳ Browser will stay open for 60 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the debug
debugTeburioLogin().catch(console.error); 