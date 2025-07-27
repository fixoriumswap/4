import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import WalletDashboard from '../components/WalletDashboard';
import SendReceive from '../components/SendReceive';
import TokenSwap from '../components/TokenSwap';
import TransactionHistory from '../components/TransactionHistory';
import Staking from '../components/Staking';
import Settings from '../components/Settings';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'send', label: 'Send/Receive', icon: '💸' },
    { id: 'swap', label: 'Swap', icon: '🔄' },
    { id: 'history', label: 'History', icon: '📊' },
    { id: 'staking', label: 'Staking', icon: '🥞' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
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

  return (
    <div className="app-container" suppressHydrationWarning>
      <Navbar />
      
      {!publicKey ? (
        <div className="connect-prompt">
          <div className="connect-card">
            <div className="connect-icon">🔐</div>
            <h2>Connect Your Wallet</h2>
            <p>Connect your Solana wallet to access all features including portfolio management, trading, staking, and more.</p>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <span>View Portfolio & Balances</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔄</span>
                <span>Token Swapping</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💸</span>
                <span>Send & Receive Tokens</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🥞</span>
                <span>SOL Staking</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Transaction History</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <main className="main-content">
          <div className="tab-navigation">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className="tab-content">
            {renderActiveTab()}
          </div>
        </main>
      )}
    </div>
  );
}
