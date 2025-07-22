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
            <h1>🏰 Castle Concierge</h1>
            <p>Your digital bartender at The Castle Pub</p>
            <button onClick={clearChat} className="clear-btn" title="Start fresh conversation">
              🗑️ Clear
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
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          background: #1a1a1a;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .chat-header {
          background: linear-gradient(135deg, #2c1810, #5d3317);
          border-bottom: 2px solid #8b4513;
          padding: 1rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .header-content h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
          color: #ffd700;
        }

        .header-content p {
          margin: 0;
          font-size: 0.9rem;
          color: #cccccc;
          flex-grow: 1;
        }

        .clear-btn {
          background: #444;
          border: 1px solid #666;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: background-color 0.2s;
        }

        .clear-btn:hover {
          background: #555;
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
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: #222;
        }

        .message {
          display: flex;
          max-width: 80%;
          animation: messageSlide 0.3s ease-out;
        }

        .user-message {
          align-self: flex-end;
        }

        .assistant-message {
          align-self: flex-start;
        }

        .message-content {
          background: #333;
          padding: 1rem;
          border-radius: 12px;
          position: relative;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .user-message .message-content {
          background: linear-gradient(135deg, #8b4513, #a0522d);
          color: white;
        }

        .assistant-message .message-content {
          background: linear-gradient(135deg, #1e3a8a, #1e40af);
          color: white;
        }

        .message-text {
          line-height: 1.5;
          margin-bottom: 0.5rem;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .message-time {
          font-size: 0.7rem;
          opacity: 0.7;
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
          background: #ffffff;
          animation: typingPulse 1.4s infinite ease-in-out;
        }

        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }

        .error-banner {
          background: #dc2626;
          color: white;
          padding: 0.75rem;
          text-align: center;
          font-size: 0.9rem;
          border-bottom: 1px solid #b91c1c;
        }

        .chat-form {
          padding: 1rem;
          background: #1a1a1a;
          border-top: 1px solid #333;
        }

        .input-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .chat-input {
          flex: 1;
          padding: 1rem;
          border: 2px solid #444;
          border-radius: 8px;
          background: #333;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .chat-input:focus {
          border-color: #8b4513;
        }

        .chat-input::placeholder {
          color: #888;
        }

        .send-button {
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #8b4513, #a0522d);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .send-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #a0522d, #cd853f);
          transform: translateY(-1px);
        }

        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .input-hint {
          font-size: 0.8rem;
          color: #888;
          text-align: center;
        }

        .chat-footer {
          background: #111;
          padding: 1rem;
          text-align: center;
          border-top: 1px solid #333;
          font-size: 0.8rem;
          color: #888;
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

        /* Responsive Design */
        @media (max-width: 768px) {
          .chat-container {
            height: 100vh;
          }
          
          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .header-content h1 {
            font-size: 1.25rem;
          }
          
          .message {
            max-width: 95%;
          }
          
          .input-container {
            flex-direction: column;
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