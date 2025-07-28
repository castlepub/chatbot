import { useState } from 'react';
import Head from 'next/head';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function StaffInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [staffKey, setStaffKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/staff-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversation: messages,
          staffKey: staffKey
        }),
      });

      const data = await response.json();

      if (data.error) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          alert('Invalid staff key. Please check your credentials.');
          return;
        }
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = () => {
    if (staffKey.trim()) {
      setIsAuthenticated(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isAuthenticated) {
        sendMessage();
      } else {
        handleAuth();
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Castle Pub - Staff Interface</title>
        </Head>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">🏰 Castle Pub</h1>
              <h2 className="text-lg text-gray-600">Staff Interface</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Access Key
                </label>
                <input
                  type="password"
                  value={staffKey}
                  onChange={(e) => setStaffKey(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter staff key..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <button
                onClick={handleAuth}
                className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors"
              >
                Access Staff Interface
              </button>
              
              <div className="text-xs text-gray-500 text-center">
                Default key: castle-staff-2024
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Castle Pub - Staff Assistant</title>
      </Head>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-amber-800 text-white p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">🏰 Castle Pub Staff Assistant</h1>
              <p className="text-amber-200 text-sm">Detailed reservation and operational data</p>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-amber-200 hover:text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
          {/* Messages */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border p-4 mb-4 overflow-y-auto min-h-[400px]">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <p className="mb-2">👥 Staff Assistant Ready</p>
                <p className="text-sm">Ask about reservations, room availability, guest details, or operational statistics.</p>
                <div className="mt-4 text-xs">
                  <p><strong>Example queries:</strong></p>
                  <p>• "What reservations do we have today?"</p>
                  <p>• "Show me the Middle Room bookings"</p>
                  <p>• "How busy are we expected to be tonight?"</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {isLoading && (
              <div className="flex justify-start mt-4">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                    <span>Staff Assistant is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about reservations, availability, or operations..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 