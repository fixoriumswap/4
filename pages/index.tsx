import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useWalletContext } from '../components/WalletContext';
import ModernNavbar from '../components/ModernNavbar';
import WalletDashboard from '../components/WalletDashboard';
import SendReceive from '../components/SendReceive';
import TokenSwap from '../components/TokenSwap';
import TransactionHistory from '../components/TransactionHistory';
import Staking from '../components/Staking';
import Settings from '../components/Settings';

export default function Home() {
  const { data: session } = useSession();
  const {
    publicKey,
    isConnected,
    isLoading,
    signInWithGmail
  } = useWalletContext();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Gmail wallet is the only connection type
  const connectionType = 'gmail';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', gradient: 'from-blue-500 to-purple-600' },
    { id: 'send', label: 'Send/Receive', icon: '💸', gradient: 'from-green-500 to-teal-600' },
    { id: 'swap', label: 'Swap', icon: '🔄', gradient: 'from-orange-500 to-red-600' },
    { id: 'history', label: 'History', icon: '📊', gradient: 'from-purple-500 to-pink-600' },
    { id: 'staking', label: 'Staking', icon: '🥞', gradient: 'from-yellow-500 to-orange-600' },
    { id: 'settings', label: 'Settings', icon: '⚙️', gradient: 'from-gray-500 to-gray-700' }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <WalletDashboard />;
      case 'send':
        return <SendReceive />;
      case 'swap':
        return <TokenSwap />;
      case 'history':
        return <TransactionHistory />;
      case 'staking':
        return <Staking />;
      case 'settings':
        return <Settings />;
      default:
        return <WalletDashboard />;
    }
  };

  if (!mounted) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading Solana Wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" suppressHydrationWarning>
      <ModernNavbar
        onConnectWallet={signInWithGmail}
        isConnected={isConnected}
        connectionType={connectionType}
        publicKey={publicKey}
      />
      
      {!isConnected ? (
        <div className="connect-prompt">
          <div className="connect-hero">
            <div className="hero-background">
              <div className="floating-elements">
                <div className="float-1"></div>
                <div className="float-2"></div>
                <div className="float-3"></div>
                <div className="float-4"></div>
              </div>
            </div>
            
            <div className="hero-content">
              <div className="hero-icon">
                <svg viewBox="0 0 120 120" className="main-logo">
                  <defs>
                    <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="25%" stopColor="#764ba2" />
                      <stop offset="50%" stopColor="#f093fb" />
                      <stop offset="75%" stopColor="#f5576c" />
                      <stop offset="100%" stopColor="#4facfe" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <circle cx="60" cy="60" r="50" fill="url(#heroGradient)" filter="url(#glow)" />
                  <path
                    d="M35 45 L60 25 L85 45 L85 65 L60 85 L35 65 Z"
                    fill="rgba(255,255,255,0.9)"
                    filter="url(#glow)"
                  />
                  <circle cx="60" cy="55" r="15" fill="url(#heroGradient)" />
                </svg>
              </div>
              
              <h1 className="hero-title">
                Welcome to 
                <span className="gradient-text">Solana Wallet</span>
              </h1>
              
              <p className="hero-description">
                The most advanced Solana wallet experience. Sign in with your Gmail account for instant access.
                Trade, stake, and manage your portfolio with bank-level security and OAuth 2.0 authentication.
              </p>

              <div className="connection-options">
                <button
                  className="connect-option gmail-option"
                  onClick={signInWithGmail}
                  disabled={isLoading}
                >
                  <div className="option-icon">
                    <svg viewBox="0 0 24 24" className="gmail-icon">
                      <path fill="currentColor" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.5 4.64L12 9.548l6.5-4.908 1.573-1.147C21.69 2.28 24 3.434 24 5.457z"/>
                    </svg>
                  </div>
                  <div className="option-content">
                    <h3>{isLoading ? 'Connecting...' : 'Sign in with Gmail'}</h3>
                    <p>Secure, passwordless wallet creation with Google OAuth</p>
                  </div>
                  <div className="option-arrow">{isLoading ? '⏳' : '→'}</div>
                </button>
              </div>

              <div className="features-preview">
                <div className="feature-cards">
                  {[
                    { icon: '🚀', title: 'Lightning Fast', desc: 'Sub-second transactions' },
                    { icon: '🔒', title: 'Bank Security', desc: 'Military-grade encryption' },
                    { icon: '💎', title: 'Full DeFi', desc: 'Complete ecosystem access' },
                    { icon: '🌍', title: 'Global Access', desc: 'Available worldwide' },
                  ].map((feature, i) => (
                    <div key={i} className="feature-card">
                      <span className="feature-icon">{feature.icon}</span>
                      <h4>{feature.title}</h4>
                      <p>{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <main className="main-content">
          <div className="tab-navigation">
            <div className="tab-container">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id 
                      ? `linear-gradient(135deg, var(--${tab.gradient.split(' ')[0].split('-')[1]}-500), var(--${tab.gradient.split(' ')[2].split('-')[1]}-600))` 
                      : 'transparent'
                  }}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                  {activeTab === tab.id && <div className="tab-indicator"></div>}
                </button>
              ))}
            </div>
          </div>
          
          <div className="tab-content">
            {renderActiveTab()}
          </div>
        </main>
      )}



      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
        }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .loading-content {
          text-align: center;
          color: white;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .connect-prompt {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .connect-hero {
          max-width: 1200px;
          width: 100%;
          position: relative;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          border-radius: 32px;
        }

        .floating-elements {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .floating-elements > div {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
          animation: float 6s ease-in-out infinite;
        }

        .float-1 {
          width: 200px;
          height: 200px;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .float-2 {
          width: 150px;
          height: 150px;
          background: linear-gradient(45deg, #4ecdc4, #45b7d1);
          top: 20%;
          right: 20%;
          animation-delay: 1s;
        }

        .float-3 {
          width: 180px;
          height: 180px;
          background: linear-gradient(45deg, #f9ca24, #f0932b);
          bottom: 20%;
          left: 20%;
          animation-delay: 2s;
        }

        .float-4 {
          width: 120px;
          height: 120px;
          background: linear-gradient(45deg, #eb4d4b, #6c5ce7);
          bottom: 30%;
          right: 30%;
          animation-delay: 3s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          padding: 60px 40px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 16px 32px rgba(0, 0, 0, 0.1);
        }

        .hero-icon {
          margin: 0 auto 40px;
          width: 120px;
          height: 120px;
        }

        .main-logo {
          width: 100%;
          height: 100%;
          animation: logoFloat 4s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }

        .hero-title {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 24px;
          color: #1a202c;
          line-height: 1.2;
        }

        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
        }

        .hero-description {
          font-size: 18px;
          color: #4a5568;
          margin-bottom: 48px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .connection-options {
          display: flex;
          justify-content: center;
          margin-bottom: 48px;
        }

        .connect-option {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 32px 40px;
          background: linear-gradient(145deg, #f7fafc 0%, #edf2f7 100%);
          border: 2px solid transparent;
          border-radius: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          position: relative;
          overflow: hidden;
          max-width: 500px;
          width: 100%;
        }

        .connect-option:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .connect-option::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          transition: left 0.5s ease;
        }

        .connect-option:hover::before {
          left: 100%;
        }

        .connect-option:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border-color: rgba(102, 126, 234, 0.3);
        }

        .option-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .option-icon svg {
          width: 24px;
          height: 24px;
        }

        .option-content {
          flex: 1;
        }

        .option-content h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
        }

        .option-content p {
          margin: 0;
          font-size: 14px;
          color: #718096;
        }

        .option-arrow {
          font-size: 24px;
          color: #667eea;
          font-weight: bold;
          transition: transform 0.3s ease;
        }

        .connect-option:hover .option-arrow {
          transform: translateX(5px);
        }

        .features-preview {
          margin-top: 48px;
        }

        .feature-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .feature-card {
          text-align: center;
          padding: 20px;
          background: linear-gradient(145deg, #f0f4f8 0%, #e2e8f0 100%);
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          font-size: 32px;
          margin-bottom: 12px;
          display: block;
        }

        .feature-card h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
        }

        .feature-card p {
          margin: 0;
          font-size: 12px;
          color: #718096;
        }

        .main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 100px 20px 40px;
          min-height: calc(100vh - 80px);
        }

        .tab-navigation {
          margin-bottom: 40px;
        }

        .tab-container {
          display: flex;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow-x: auto;
          gap: 4px;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: transparent;
          border: none;
          border-radius: 16px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          position: relative;
          min-width: fit-content;
        }

        .tab-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateY(-2px);
        }

        .tab-button.active {
          color: white;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
        }

        .tab-icon {
          font-size: 18px;
        }

        .tab-label {
          font-weight: 600;
        }

        .tab-indicator {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 3px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 2px;
        }

        .tab-content {
          animation: fadeInUp 0.5s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .hero-content {
            padding: 40px 24px;
          }

          .hero-title {
            font-size: 36px;
          }

          .hero-description {
            font-size: 16px;
          }

          .connection-options {
            margin-bottom: 32px;
          }

          .connect-option {
            padding: 24px;
            gap: 16px;
          }

          .feature-cards {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .main-content {
            padding: 100px 16px 24px;
          }

          .tab-container {
            padding: 6px;
          }

          .tab-button {
            padding: 12px 16px;
            font-size: 12px;
          }

          .tab-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
