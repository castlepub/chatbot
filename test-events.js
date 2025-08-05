const fs = require('fs');
const path = require('path');

async function testEvents() {
  try {
    console.log('🧪 Testing events data...');
    
    // Read the events.json file directly
    const eventsPath = path.join(__dirname, 'data', 'events.json');
    console.log('📁 Looking for events file at:', eventsPath);
    
    if (!fs.existsSync(eventsPath)) {
      console.error('❌ Events file not found at:', eventsPath);
      return;
    }
    
    const fileContent = fs.readFileSync(eventsPath, 'utf8');
    console.log('📄 File content length:', fileContent.length);
    
    const eventsData = JSON.parse(fileContent);
    console.log('✅ Events data loaded successfully!');
    console.log('\n📅 Current events:');
    
    if (eventsData.upcoming_events) {
      Object.keys(eventsData.upcoming_events).forEach(month => {
        console.log(`\n${month.toUpperCase()}:`);
        const monthEvents = eventsData.upcoming_events[month];
        Object.keys(monthEvents).forEach(eventKey => {
          const event = monthEvents[eventKey];
          console.log(`  - ${event.name} (${event.date})`);
          if (event.time && event.time !== 'TBD') {
            console.log(`    Time: ${event.time}`);
          }
          if (event.description) {
            console.log(`    ${event.description}`);
          }
        });
      });
    } else {
      console.log('❌ No upcoming events found');
    }
    
    console.log('\n🏪 Regular features:');
    Object.keys(eventsData.regular_features).forEach(feature => {
      const featureData = eventsData.regular_features[feature];
      console.log(`  - ${featureData.name}: ${featureData.description}`);
    });
    
    console.log('\n🍺 Special features:');
    Object.keys(eventsData.special_features).forEach(feature => {
      const featureData = eventsData.special_features[feature];
      console.log(`  - ${featureData.name}: ${featureData.description}`);
    });
    
    if (eventsData.last_updated) {
      console.log(`\n🕒 Last updated: ${eventsData.last_updated}`);
    }
    
    if (eventsData.updated_by) {
      console.log(`📝 Updated by: ${eventsData.updated_by}`);
    }
    
    console.log('\n🎉 Events test completed successfully!');
    
  } catch (error) {
    console.error('❌ Events test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testEvents(); 