import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function CastleConcierge() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Well, well, well... another guest! I'm the Castle Concierge. Need to know something about our fine establishment? Ask away, but make it interesting. 🍺",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation: messages
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Ugh, my system's acting up. Try again in a moment, will ya?",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Fresh start? I like that. What can I help you with at The Castle?",
        timestamp: new Date().toISOString()
      }
    ]);
    setError(null);
  };

  return (
    <>
      <Head>
        <title>Castle Concierge | The Castle Pub Berlin</title>
        <meta name="description" content="Your sarcastic digital bartender at The Castle Pub Berlin. Ask about our menu, events, hours, and more!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="chat-container">
        <header className="chat-header">
          <div className="header-content">
            <img src="/logo.png" alt="The Castle Pub Logo" className="chat-logo" />
            <h1>Castle Concierge</h1>
            <p>Your digital bartender at The Castle Pub</p>
            <button onClick={clearChat} className="clear-btn" title="Start fresh conversation">
              Clear
            </button>
          </div>
        </header>

        <main className="chat-main">
          <div className="messages-container">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="error-banner">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={sendMessage} className="chat-form">
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the Concierge anything about The Castle..."
                className="chat-input"
                disabled={isLoading}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="send-button"
                title="Send message"
              >
                {isLoading ? '⏳' : '📨'}
              </button>
            </div>
            <div className="input-hint">
              Try asking about our menu, events, hours, or beer selection!
            </div>
          </form>
        </main>

        <footer className="chat-footer">
          <p>🍺 <strong>The Castle Pub</strong> | Invalidenstraße 129, Berlin</p>
          <p>Powered by Castle Concierge AI</p>
        </footer>
      </div>

      <style jsx>{`
        .chat-logo {
          height: 48px;
          margin-right: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10);
          background: white;
          padding: 4px;
        }
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 480px;
          margin: 0 auto;
          background: #f7f7f9;
          color: #232323;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          overflow: hidden;
        }
        .chat-header {
          background: #fff;
          border-bottom: 1px solid #ececec;
          padding: 1.2rem 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .header-content h1 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          color: #232323;
          letter-spacing: 0.01em;
        }
        .header-content p {
          margin: 0;
          font-size: 0.95rem;
          color: #666;
          flex-grow: 1;
        }
        .clear-btn {
          background: #f2f2f2;
          border: 1px solid #e0e0e0;
          color: #232323;
          padding: 0.5rem 1.1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: background 0.2s, border 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .clear-btn:hover {
          background: #e9e9e9;
          border: 1px solid #bdbdbd;
        }
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 1rem 1rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          background: #f7f7f9;
        }
        .message {
          display: flex;
          max-width: 85%;
          animation: messageSlide 0.3s ease-out;
        }
        .user-message {
          align-self: flex-end;
        }
        .assistant-message {
          align-self: flex-start;
        }
        .message-content {
          background: #fff;
          padding: 1.1rem 1.2rem;
          border-radius: 16px;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          font-size: 1rem;
          line-height: 1.6;
        }
        .user-message .message-content {
          background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
          color: #232323;
          box-shadow: 0 2px 8px rgba(140, 200, 255, 0.10);
        }
        .assistant-message .message-content {
          background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
          color: #232323;
          box-shadow: 0 2px 8px rgba(200, 200, 200, 0.10);
        }
        .message-text {
          margin-bottom: 0.4rem;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .message-time {
          font-size: 0.75rem;
          opacity: 0.6;
          text-align: right;
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 0.5rem 0;
        }
        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #bbb;
          animation: typingPulse 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        .error-banner {
          background: #ff4d4f;
          color: white;
          padding: 0.75rem;
          text-align: center;
          font-size: 0.95rem;
          border-bottom: 1px solid #b91c1c;
          border-radius: 0 0 8px 8px;
          margin: 0 1rem;
        }
        .chat-form {
          padding: 1rem;
          background: #1a1a1a;
          border-top: 1px solid #333;
        }
        .input-container {
          display: flex;
          gap: 0.7rem;
          margin-bottom: 0.5rem;
          padding: 0 1rem;
        }
        .chat-input {
          flex: 1;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          background: #fff;
          color: #232323;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .chat-input:focus {
          border-color: #8ec5fc;
        }
        .chat-input::placeholder {
          color: #bbb;
        }
        .send-button {
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #8ec5fc 0%, #e0c3fc 100%);
          border: none;
          border-radius: 10px;
          color: #232323;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.07);
          font-weight: 600;
        }
        .send-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
          transform: translateY(-1px);
        }
        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .input-hint {
          font-size: 0.85rem;
          color: #888;
          text-align: center;
          margin-bottom: 0.5rem;
        }
        .chat-footer {
          background: #fff;
          padding: 1rem;
          text-align: center;
          border-top: 1px solid #ececec;
          font-size: 0.85rem;
          color: #888;
          letter-spacing: 0.01em;
        }
        .chat-footer p {
          margin: 0.25rem 0;
        }
        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes typingPulse {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @media (max-width: 600px) {
          .chat-container {
            height: 100vh;
            max-width: 100vw;
            border-radius: 0;
          }
          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .header-content h1 {
            font-size: 1.1rem;
          }
          .message {
            max-width: 98%;
          }
          .input-container {
            flex-direction: column;
            gap: 0.5rem;
          }
          .send-button {
            padding: 0.75rem;
          }
        }
        /* Iframe-friendly styling */
        @media (max-height: 600px) {
          .chat-header {
            padding: 0.75rem;
          }
          
          .chat-footer {
            padding: 0.75rem;
          }
        }
      `}</style>
    </>
  );
} 