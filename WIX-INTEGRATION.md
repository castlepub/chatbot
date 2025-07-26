# Castle Pub Chat Widget - Wix Integration Guide

## 🚀 Quick Setup for Wix

### Step 1: Get Your Railway URL
First, you need your Railway app URL. It should look like:
```
https://your-app-name.railway.app
```

### Step 2: Update the Widget Configuration
In the `public/chat-widget.js` file, update line 6:
```javascript
apiUrl: 'https://your-app-name.railway.app/api/gpt', // Replace with your actual Railway URL
```

### Step 3: Add to Wix Website

#### Option A: Using Wix Custom Code (Recommended)

1. **In your Wix dashboard:**
   - Go to Settings → Custom Code
   - Click "Add Custom Code"

2. **Add this code to the `<head>` section:**
   ```html
   <script>
   // Castle Pub Chat Widget Configuration
   window.CASTLE_CHAT_CONFIG = {
     apiUrl: 'https://your-app-name.railway.app/api/gpt',
     widgetTitle: 'Castle Pub Concierge',
     welcomeMessage: 'Hi! I\'m your Castle Pub assistant. How can I help you today?',
     placeholder: 'Ask me anything about Castle Pub...',
     colors: {
       primary: '#8B4513', // Brown
       secondary: '#D2691E', // Orange
       text: '#333333',
       background: '#FFFFFF',
       bubble: '#8B4513'
     }
   };
   </script>
   <script src="https://your-app-name.railway.app/chat-widget.js"></script>
   ```

3. **Set the code to load on:**
   - All pages
   - Before `</body>` tag

#### Option B: Using Wix Velo (Advanced)

1. **In your Wix dashboard:**
   - Go to Developer Tools → Velo by Wix
   - Open the Page Code

2. **Add this code to your page:**
   ```javascript
   import wixWindow from 'wix-window';

   $w.onReady(function () {
     // Load the chat widget
     wixWindow.rendered.then(() => {
       const script = document.createElement('script');
       script.src = 'https://your-app-name.railway.app/chat-widget.js';
       document.head.appendChild(script);
     });
   });
   ```

## 🎨 Customization Options

### Colors
You can customize the widget colors by modifying the `colors` object:
```javascript
colors: {
  primary: '#8B4513',    // Main color (buttons, user messages)
  secondary: '#D2691E',  // Secondary color
  text: '#333333',       // Text color
  background: '#FFFFFF', // Background color
  bubble: '#8B4513'      // Chat bubble color
}
```

### Text
Customize the widget text:
```javascript
widgetTitle: 'Castle Pub Concierge',
welcomeMessage: 'Hi! I\'m your Castle Pub assistant. How can I help you today?',
placeholder: 'Ask me anything about Castle Pub...'
```

### Position
The widget appears in the bottom-right corner by default. To change position, modify the CSS in `chat-widget.js`:
```css
position: fixed;
bottom: 20px;  /* Distance from bottom */
right: 20px;   /* Distance from right */
```

## 📱 Mobile Responsiveness

The widget is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🔧 Troubleshooting

### Widget Not Appearing
1. Check that the Railway URL is correct
2. Ensure the script is loaded in the `<head>` section
3. Check browser console for errors

### API Connection Issues
1. Verify your Railway app is running
2. Check that the `/api/gpt` endpoint is accessible
3. Test the API directly: `https://your-app-name.railway.app/api/gpt`

### Styling Conflicts
If the widget doesn't look right:
1. Check for CSS conflicts with your Wix theme
2. Adjust the z-index if needed (currently 9999)
3. Modify colors to match your website theme

## 📊 Analytics & Monitoring

The widget automatically sends Telegram notifications when used. You'll receive:
- User questions
- Bot responses
- Timestamps
- User IP addresses

## 🚀 Testing

1. **Test locally:**
   - Open `public/test-widget.html` in your browser
   - The chat bubble should appear in the bottom-right corner

2. **Test on Wix:**
   - Deploy the widget to your Wix site
   - Ask the bot questions about Castle Pub
   - Check your Telegram for notifications

## 📞 Support

If you need help:
1. Check the browser console for errors
2. Verify your Railway app is running
3. Test the API endpoint directly
4. Check Telegram notifications are working

## 🎯 Features

- ✅ Real-time chat interface
- ✅ Mobile responsive
- ✅ Customizable colors and text
- ✅ Telegram notifications
- ✅ Typing indicators
- ✅ Error handling
- ✅ Conversation history (can be expanded)
- ✅ Keyboard shortcuts (Enter to send)

## 🔄 Updates

To update the widget:
1. Modify the `chat-widget.js` file
2. Push changes to Railway
3. Clear browser cache on your Wix site
4. The new version will load automatically 