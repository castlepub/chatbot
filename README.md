# 🏰 Castle Concierge Chatbot

A sarcastic, GPT-4 powered concierge chatbot for **The Castle Pub** in Berlin. This Next.js web application serves as a digital bartender, answering guest questions about the pub's menu, events, hours, loyalty program, and more - all with The Castle's signature wit and attitude.

## ✨ Features

- **🤖 GPT-4 Powered**: Advanced conversational AI with personality
- **🍺 Live Beer Menu**: Integration with rotating beer selection API  
- **📱 Responsive Design**: Works on desktop, mobile, and as an iframe embed
- **🎯 Contextual Responses**: Knows current hours, events, and menu items
- **⚡ Real-time Chat**: Fast, interactive messaging interface
- **🏆 Loyalty Program**: Information about Castle's point system and rewards
- **🎨 Castle-themed UI**: Dark theme with pub-appropriate styling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- (Optional) Railway beer menu API endpoint

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your keys:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
BEER_API_URL=https://your-railway-project.com/api/beers
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)** to chat with the Castle Concierge!

## 📂 Project Structure

```
castle-concierge-chatbot/
├── pages/
│   ├── index.tsx           # Main chat UI
│   └── api/
│       └── gpt.ts          # GPT-4 handler
├── data/                   # JSON data files
│   ├── menu.json          # Food, drinks, cocktails
│   ├── hours.json         # Opening hours
│   ├── events.json        # Pub quiz, karaoke, sports
│   ├── faq.json           # House rules, policies  
│   └── loyalty.json       # Points and rewards
├── utils/
│   ├── formatData.ts      # Context formatting for GPT
│   └── fetchBeerData.ts   # Railway API integration
└── README.md
```

## 🍻 Castle Pub Information

The chatbot knows about:

### 🍕 **Menu**
- Food: Nachos, pizzas, burgers, wings
- Cocktails: Mojitos, Negronis, Old Fashioneds
- Spirits: Whiskey, gin, vodka selections
- **Live Beer Taps**: Rotating selection updated from API

### 📅 **Events**
- **Tuesday**: Pub Quiz at 20:00 (€50 prize!)
- **Thursday**: Karaoke Night at 21:00  
- **Weekends**: Live sports viewing
- Special events: Oktoberfest, New Year's parties

### 🕐 **Hours**
- **Mon-Wed**: 16:00 - 01:00
- **Thu**: 16:00 - 02:00  
- **Fri**: 16:00 - 03:00
- **Sat**: 14:00 - 03:00
- **Sun**: 14:00 - 01:00
- **Kitchen**: 17:00 - 23:00 daily

### 🏆 **Loyalty Program**
- 1 point per €1 spent
- Rewards from free coffee (50 pts) to VIP nights (1000 pts)
- Membership tiers: Regular → Bronze → Silver → Gold

## 🔧 Configuration

### System Prompt
The Castle Concierge personality is defined in `/pages/api/gpt.ts`. Key traits:
- Sarcastic but helpful
- Berlin pub attitude
- Playful mockery for obvious questions
- Always informative despite the wit

### Data Updates
Update JSON files in `/data/` to modify:
- Menu items and prices
- Event schedules  
- House rules and policies
- Loyalty rewards

### Beer API Integration
The `fetchBeerData.ts` utility fetches live beer data from your Railway project. Falls back to static data if API is unavailable.

## 🌐 Deployment

### Railway Deployment
```bash
# Connect to Railway
railway login
railway init
railway add
railway up
```

### Vercel Deployment  
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables for Production
```env
OPENAI_API_KEY=sk-your-production-key
BEER_API_URL=https://your-beer-api.railway.app/api/beers
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📱 Iframe Embedding

The chatbot is designed for iframe embedding in The Castle's main website:

```html
<iframe 
  src="https://your-chatbot-domain.com" 
  width="400" 
  height="600"
  style="border: none; border-radius: 12px;">
</iframe>
```

## 🔮 Future Enhancements

- **Marsello API Integration**: Live loyalty point tracking
- **Google Maps**: Directions and location info  
- **Multilingual Support**: German/English toggle
- **Admin Dashboard**: Update events and menu data
- **Booking Integration**: Table reservations (when APIs available)

## 🛠️ Development

### Adding New Data
1. Update relevant JSON files in `/data/`
2. Modify formatting functions in `utils/formatData.ts` if needed
3. Test with the development server

### Customizing Personality
Edit the `SYSTEM_PROMPT` in `/pages/api/gpt.ts` to adjust the Concierge's tone and behavior.

### Beer API Integration
Implement your beer menu API to match the `BeerResponse` interface in `utils/fetchBeerData.ts`.

## 📝 License

Private project for The Castle Pub Berlin.

---

**🍺 Prost! Enjoy chatting with the Castle Concierge!** 