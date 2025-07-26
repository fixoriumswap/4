import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface AIHelplineProps {
  onClose: () => void;
}

export default function AIHelpline({ onClose }: AIHelplineProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Welcome message
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "👋 Hello! I'm your 24/7 AI assistant for Solana trading. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const predefinedResponses: { [key: string]: string } = {
    'slippage': "Slippage is the difference between expected and actual trade prices. For most trades, 0.5-1% slippage is recommended. You can adjust this in Settings ⚙️.",
    'fees': "Jupiter aggregator typically charges 0.1-0.3% fees. Transaction fees depend on Solana network congestion, usually around 0.00025 SOL.",
    'phantom': "Phantom is a secure Solana wallet. Make sure you download it from official sources: phantom.app. Never share your seed phrase!",
    'pump.fun': "Pump.fun tokens are meme coins on Solana. Be careful - they're highly volatile! Always do your research before trading.",
    'swap': "To swap tokens: 1) Connect your wallet 2) Select from/to tokens 3) Enter amount 4) Review quote 5) Confirm transaction",
    'balance': "If your balance isn't showing, try refreshing or switching RPC endpoints. The app uses multiple fallbacks for reliability.",
    'send': "To send SOL: Click 'Send/Receive' → 'Send SOL' → Enter recipient address and amount → Confirm transaction",
    'receive': "To receive SOL: Click 'Send/Receive' → 'Receive SOL' → Copy your address or show QR code to sender",
    'help': "I can help with: Trading, Wallet issues, Slippage settings, Fees, Security tips, Token information, and general Solana questions!"
  };

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for specific keywords
    for (const [keyword, response] of Object.entries(predefinedResponses)) {
      if (message.includes(keyword)) {
        return response;
      }
    }

    // Check for common greetings
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hi there! 👋 I'm here to help with your Solana trading questions. What would you like to know?";
    }

    // Check for security questions
    if (message.includes('safe') || message.includes('secure') || message.includes('scam')) {
      return "🔒 Security tips: 1) Never share your seed phrase 2) Only use official wallet apps 3) Double-check token addresses 4) Start with small amounts 5) Be cautious with new/unknown tokens";
    }

    // Check for price/market questions
    if (message.includes('price') || message.includes('chart') || message.includes('market')) {
      return "📈 For real-time prices and charts, I recommend checking CoinGecko, DexScreener, or Jupiter Terminal. This app focuses on secure swapping rather than price tracking.";
    }

    // Check for technical issues
    if (message.includes('error') || message.includes('failed') || message.includes('not working')) {
      return "🔧 For technical issues: 1) Check your internet connection 2) Ensure wallet is connected 3) Try refreshing the page 4) Check if you have enough SOL for fees 5) Try adjusting slippage in Settings";
    }

    // Default response
    return "I understand you're asking about '" + userMessage + "'. For specific help, try asking about: slippage, fees, swapping, sending SOL, security, or Phantom wallet. Is there something specific I can help you with?";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputMessage),
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 seconds delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "How do I adjust slippage?",
    "What are the trading fees?",
    "How to send SOL?",
    "Is this platform safe?",
    "How do swaps work?"
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai-helpline-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="helpline-header">
            <div className="bot-info">
              <div className="bot-avatar">🤖</div>
              <div>
                <h2>24/7 AI Support</h2>
                <div className="status">
                  <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="chat-container">
          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}
              >
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message bot-message typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="quick-questions">
              <p>Quick questions:</p>
              <div className="quick-buttons">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="quick-btn"
                    onClick={() => {
                      setInputMessage(question);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your question here..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
          >
            {isTyping ? <span className="spinner" /> : '📤'}
          </button>
        </div>
      </div>
    </div>
  );
}
