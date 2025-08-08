// Castle Pub Chat Widget
(function() {
  'use strict';

  // Configuration
  const config = {
    gptUrl: 'https://chatbot-production-ca03.up.railway.app/api/gpt',
    reservationsUrl: 'https://chatbot-production-ca03.up.railway.app/api/reservations',
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

  // Create widget HTML
  function createWidget() {
    const widgetHTML = `
      <div id="castle-chat-widget" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 14px;
      ">
        <!-- Chat Bubble -->
        <div id="castle-chat-bubble" style="
          width: 60px;
          height: 60px;
          background: ${config.colors.bubble};
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 0.2s;
        " onclick="toggleChat()">
          <span style="
            color: white;
            font-size: 24px;
            font-weight: bold;
          ">🍺</span>
        </div>

        <!-- Chat Window -->
        <div id="castle-chat-window" style="
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 500px;
          background: ${config.colors.background};
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          display: none;
          flex-direction: column;
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            background: ${config.colors.primary};
            color: white;
            padding: 15px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <span>${config.widgetTitle}</span>
            <span onclick="toggleChat()" style="cursor: pointer; font-size: 18px;">×</span>
          </div>

          <!-- Messages Container -->
          <div id="castle-messages" style="
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background: #f8f9fa;
          ">
            <!-- Welcome message will be added here -->
          </div>

          <!-- Input Area -->
          <div style="
            padding: 15px;
            border-top: 1px solid #e9ecef;
            background: white;
          ">
            <div style="display: flex; gap: 10px;">
              <input type="text" id="castle-chat-input" placeholder="${config.placeholder}" style="
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 20px;
                outline: none;
                font-size: 14px;
              " onkeypress="handleKeyPress(event)">
              <button onclick="sendMessage()" style="
                background: ${config.colors.primary};
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
              ">➤</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }

  // Toggle chat window
  window.toggleChat = function() {
    const window = document.getElementById('castle-chat-window');
    const bubble = document.getElementById('castle-chat-bubble');
    
    if (window.style.display === 'none' || !window.style.display) {
      window.style.display = 'flex';
      bubble.style.transform = 'scale(0.9)';
      addWelcomeMessage();
    } else {
      window.style.display = 'none';
      bubble.style.transform = 'scale(1)';
    }
  };

  // Add welcome message
  function addWelcomeMessage() {
    const messages = document.getElementById('castle-messages');
    if (messages.children.length === 0) {
      addMessage(config.welcomeMessage, 'bot');
    }
  }

  // Add message to chat
  function addMessage(text, sender) {
    const messages = document.getElementById('castle-messages');
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin-bottom: 10px;
      display: flex;
      justify-content: ${sender === 'user' ? 'flex-end' : 'flex-start'};
    `;

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 80%;
      padding: 10px 15px;
      border-radius: 18px;
      background: ${sender === 'user' ? config.colors.primary : 'white'};
      color: ${sender === 'user' ? 'white' : config.colors.text};
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      word-wrap: break-word;
    `;
    messageBubble.textContent = text;

    messageDiv.appendChild(messageBubble);
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  // Handle enter key
  window.handleKeyPress = function(event) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  // Send message to API
  window.sendMessage = async function() {
    const input = document.getElementById('castle-chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    const messages = document.getElementById('castle-messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.style.cssText = `
      margin-bottom: 10px;
      display: flex;
      justify-content: flex-start;
    `;
    typingDiv.innerHTML = `
      <div style="
        padding: 10px 15px;
        border-radius: 18px;
        background: white;
        color: ${config.colors.text};
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        <span style="font-style: italic;">Typing...</span>
      </div>
    `;
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;

    // Simple intent detect for reservations
    const lower = message.toLowerCase();
    const isReservationIntent = /\b(reserve|reservation|book( a)? table|booking)\b/.test(lower);

    // Maintain mode and session
    window.__castleMode = window.__castleMode || 'gpt';
    window.__castleSession = window.__castleSession || ('cw-' + Math.random().toString(36).slice(2));
    window.__awaitingReservationChoice = window.__awaitingReservationChoice || false;

    // If user asks about reservations while in GPT mode, offer both options
    if (window.__castleMode === 'gpt' && isReservationIntent && !window.__awaitingReservationChoice) {
      // Remove typing indicator
      const typingIndicatorX = document.getElementById('typing-indicator');
      if (typingIndicatorX) typingIndicatorX.remove();
      addMessage(
        'You can book online here: https://www.castlepub.de/reservemitte\nOr say "book here" and I\'ll handle the reservation now.',
        'bot'
      );
      window.__awaitingReservationChoice = true;
      return;
    }

    // If user opts to book here, switch to reservations mode and start flow
    if (window.__awaitingReservationChoice && /\b(book here|book now|do it here)\b/.test(lower)) {
      window.__castleMode = 'reservations';
      window.__awaitingReservationChoice = false;
      // Fall through to reservations call with a starter message
      await callReservationsApi('I want to book a table');
      return;
    }

    try {
      if (window.__castleMode === 'reservations') {
        await callReservationsApi(message);
      } else {
        const response = await fetch(config.gptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, conversation: [] })
        });
        const data = await response.json();

        // Remove typing indicator
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) typingIndicator.remove();

        addMessage(data.response || 'Sorry, I\'m having trouble right now. Please try again.', 'bot');
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      
      // Remove typing indicator
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }

      addMessage('Sorry, I\'m having trouble connecting. Please try again later.', 'bot');
    }
  };

  async function callReservationsApi(userMessage) {
    // Show typing indicator (ensure present)
    const messages = document.getElementById('castle-messages');
    let typingIndicator = document.getElementById('typing-indicator');
    if (!typingIndicator) {
      typingIndicator = document.createElement('div');
      typingIndicator.id = 'typing-indicator';
      typingIndicator.style.cssText = 'margin-bottom:10px;display:flex;justify-content:flex-start;';
      typingIndicator.innerHTML = '<div style="padding:10px 15px;border-radius:18px;background:white;color:#333;box-shadow:0 2px 4px rgba(0,0,0,0.1);"><span style="font-style: italic;">Typing...</span></div>';
      messages.appendChild(typingIndicator);
      messages.scrollTop = messages.scrollHeight;
    }

    const resp = await fetch(config.reservationsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: window.__castleSession, message: userMessage })
    });
    const data = await resp.json();

    const typingIndicator2 = document.getElementById('typing-indicator');
    if (typingIndicator2) typingIndicator2.remove();

    if (data && data.reply) {
      addMessage(data.reply, 'bot');
    } else {
      addMessage('Sorry, I\'m having trouble with bookings right now. You can use the website: https://www.castlepub.de/reservemitte', 'bot');
    }
  }

  // Initialize widget when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

})(); 