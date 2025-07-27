import React from 'react';
import Navbar from '../components/Navbar';
import FixoriumBottomBar from '../components/FixoriumBottomBar';
import { useFixoriumWallet } from '../context/FixoriumWallet';

export default function Home() {
  const { isAuthenticated, user, balance, loading } = useFixoriumWallet();

  return (
    <div style={{ minHeight: '100vh', background: '#181a20', color: '#fff', paddingBottom: '120px' }} suppressHydrationWarning>
      <Navbar />
      
      <main>
        {loading ? (
          <div className="loading-container">
            <span className="spinner" />
            <p>Loading Fixorium Wallet...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="welcome-container">
            <div className="welcome-content">
              <h1>Welcome to Fixorium Wallet</h1>
              <h2>Your Gateway to Solana & Pump.fun</h2>
              
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📥</div>
                  <h3>Deposit</h3>
                  <p>Receive SOL and any Solana tokens to your wallet</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">📤</div>
                  <h3>Withdraw</h3>
                  <p>Send SOL to any Solana address with low fees</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">🔄</div>
                  <h3>Exchange</h3>
                  <p>Swap tokens using Jupiter aggregator</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">🚀</div>
                  <h3>Pump.fun Support</h3>
                  <p>Full support for pump.fun meme tokens</p>
                </div>
              </div>

              <div className="auth-section">
                <h3>Get Started in Seconds</h3>
                <p>Sign in with your Gmail account to create your Solana wallet</p>
                <div className="auth-benefits">
                  <ul>
                    <li>✅ One Gmail account = One permanent wallet</li>
                    <li>✅ No seed phrases to remember</li>
                    <li>✅ Automatic wallet recovery</li>
                    <li>✅ Secure & encrypted</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1>Fixorium Wallet Dashboard</h1>
              <p>Welcome back, {user?.email}</p>
            </div>

            <div className="wallet-overview">
              <div className="balance-card">
                <h2>Total Balance</h2>
                <div className="balance-amount">
                  <span className="balance-value">{balance.toFixed(6)}</span>
                  <span className="balance-currency">SOL</span>
                </div>
                <div className="balance-usd">
                  ≈ ${(balance * 150).toFixed(2)} USD
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <p>Use the bottom bar to access wallet functions:</p>
                <div className="action-hints">
                  <div className="hint">📥 <strong>Deposit:</strong> Receive tokens to your wallet</div>
                  <div className="hint">📤 <strong>Withdraw:</strong> Send SOL to other addresses</div>
                  <div className="hint">🔄 <strong>Exchange:</strong> Swap tokens at best rates</div>
                  <div className="hint">⚙️ <strong>Settings:</strong> Manage wallet & view info</div>
                </div>
              </div>
            </div>

            <div className="platform-info">
              <h3>Platform Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span>Platform Fee:</span>
                  <span>0.0005 SOL per transaction</span>
                </div>
                <div className="info-item">
                  <span>Supported Networks:</span>
                  <span>Solana Mainnet</span>
                </div>
                <div className="info-item">
                  <span>Supported Tokens:</span>
                  <span>All Solana & Pump.fun tokens</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <FixoriumBottomBar />
    </div>
  );
}
