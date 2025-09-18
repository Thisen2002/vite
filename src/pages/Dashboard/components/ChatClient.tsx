import React, { useState, useEffect } from 'react';

interface ChatMessage {
  name: string;
  message: string;
}

interface ChatClientProps {
  socketUrl: string; // WebSocket URL as a prop to allow flexibility
}

const ChatClient: React.FC<ChatClientProps> = ({ socketUrl }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');

  // Establish WebSocket connection
  useEffect(() => {
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'history') {
        setMessages(data.messages || []);
      }
    };

    socket.onclose = (event) => {
      console.log('Disconnected from WebSocket server', event);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(socket);

    return () => {
      socket.close(); // Cleanup on unmount
    };
  }, [socketUrl]);

  const handleSendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN && message.trim() !== '') {
      socket.send(JSON.stringify({ message }));
      setMessage(''); // Clear the input field after sending
    }
  };

  return (
    <div className="mt-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
          <h2 className="text-xl font-bold text-gray-900">Live Chat</h2>
          <div className="ml-auto px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Connected
          </div>
        </div>
        <div className="bg-gray-50/50 rounded-xl p-4 mb-4" style={{ minHeight: 200, maxHeight: 300 }}>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No messages yet</p>
                <p className="text-gray-400 text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">{msg.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-900">{msg.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{msg.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <input
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type your message here..."
          />
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatClient;
