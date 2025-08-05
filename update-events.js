const fs = require('fs');
const path = require('path');

// Import the scraper (we'll need to compile TypeScript or use require)
async function updateEvents() {
  try {
    console.log('🔄 Starting Castle Events update...');
    
    // For now, let's manually create the events based on the website content
    // In a production environment, you'd run the TypeScript scraper
    
    const currentEvents = {
      "regular_features": {
        "beer_garden": {
          "name": "Beer Garden",
          "description": "Enjoy our spacious beer garden with a great selection of craft beers",
          "availability": "Weather permitting",
          "seating": "First come, first served"
        },
        "sports": {
          "name": "Sports Viewing",
          "description": "Home of Berlin Irish Rugby Club - watch major rugby matches and other sports",
          "note": "Check our social media for match schedules"
        },
        "self_service": {
          "name": "Self-Service Bar",
          "description": "Order at the bar, find a cozy spot, and enjoy!",
          "note": "No table service or reservations"
        },
        "quiz_night": {
          "name": "Castle Quiz",
          "description": "Weekly pub quiz in English & German",
          "schedule": "Every Monday at 8:00 PM (20:00)",
          "note": "Great fun for groups and individuals"
        }
      },
      "special_features": {
        "craft_beer": {
          "name": "Craft Beer Selection",
          "description": "20 taps featuring local and international craft beers",
          "rotation": "Regular rotation of new beers",
          "info": "Check Untappd for current selection"
        },
        "pizza": {
          "name": "Neapolitan Pizza",
          "description": "Authentic Italian pizza made fresh to order",
          "style": "Traditional Neapolitan style"
        }
      },
      "upcoming_events": {
        "august_2025": {
          "pub_talk_democracy_aug10": {
            "name": "Pub Talk-Democracy at Risk",
            "date": "August 10, 2025",
            "time": "TBD",
            "description": "Join us for an engaging discussion about democracy at The Castle Pub",
            "location": "Berlin"
          },
          "castle_quiz_aug11": {
            "name": "Castle Quiz",
            "date": "August 11, 2025",
            "time": "8:00 PM",
            "description": "Weekly pub quiz in English & German"
          }
        },
        "july_2025": {
          "uefa_womens_euro_july27": {
            "name": "UEFA Women's Euro 2025",
            "date": "July 27, 2025",
            "time": "6:00 PM",
            "description": "Watch the exciting UEFA Women's Euro 2025 matches at The Castle Pub Berlin"
          }
        },
        "june_2025": {
          "spain_france_nations_league_june5": {
            "name": "Spain vs. France UEFA Nations League Semi Finals",
            "date": "June 5, 2025",
            "time": "TBD",
            "description": "Watch the UEFA Nations League Semi Finals match between Spain and France"
          },
          "germany_portugal_nations_league_june4": {
            "name": "Germany Vs. Portugal UEFA Nations League",
            "date": "June 4, 2025",
            "time": "TBD",
            "description": "Watch the UEFA Nations League match between Germany and Portugal"
          }
        },
        "may_2025": {
          "champions_league_finale_may31": {
            "name": "Champions League - Finale",
            "date": "May 31, 2025",
            "time": "TBD",
            "description": "Watch the Champions League Final at The Castle Berlin Mitte"
          },
          "dfb_pokal_finale_may24": {
            "name": "DFB Pokal Finale",
            "date": "May 24, 2025",
            "time": "TBD",
            "description": "Watch the DFB Pokal Final at The Castle Pub"
          }
        }
      },
      "venue_info": {
        "atmosphere": "Casual, friendly neighborhood pub",
        "location": "Heart of Berlin Mitte",
        "specialties": ["Craft Beer", "Neapolitan Pizza", "Sports Viewing", "Beer Garden", "Quiz Nights"],
        "events_page": "https://www.castlepub.de/events"
      },
      "last_updated": new Date().toISOString(),
      "updated_by": "manual_update_from_website"
    };

    // Write the updated events to the file
    const eventsPath = path.join(__dirname, 'data', 'events.json');
    fs.writeFileSync(eventsPath, JSON.stringify(currentEvents, null, 2));
    
    console.log('✅ Events updated successfully!');
    console.log('📅 Current events include:');
    console.log('   - Pub Talk-Democracy at Risk (Aug 10)');
    console.log('   - Castle Quiz (Aug 11)');
    console.log('   - UEFA Women\'s Euro 2025 (Jul 27)');
    console.log('   - UEFA Nations League matches (Jun 4-5)');
    console.log('   - Champions League Final (May 31)');
    console.log('   - DFB Pokal Final (May 24)');
    
    return currentEvents;
    
  } catch (error) {
    console.error('❌ Error updating events:', error);
    throw error;
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateEvents()
    .then(() => {
      console.log('🎉 Events update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Events update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateEvents }; 