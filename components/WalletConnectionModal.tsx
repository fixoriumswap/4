import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletName } from '@solana/wallet-adapter-base';

interface WalletConnectionModalProps {
  onClose: () => void;
}

export default function WalletConnectionModal({ onClose }: WalletConnectionModalProps) {
  const { select, wallets, connect, connecting } = useWallet();
  const [activeTab, setActiveTab] = useState<'gmail' | 'extension'>('gmail');
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const handleGmailSignIn = async () => {
    try {
      setConnectingWallet('gmail');
      await signIn('google', { 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Gmail sign in error:', error);
      setConnectingWallet(null);
    }
  };

  const handleWalletConnect = async (walletName: WalletName) => {
    try {
      setConnectingWallet(walletName);
      select(walletName);
      await connect();
      onClose();
    } catch (error) {
      console.error('Wallet connection error:', error);
      setConnectingWallet(null);
    }
  };

  const popularWallets = [
    { name: 'Phantom', icon: '👻', description: 'The most popular Solana wallet' },
    { name: 'Solflare', icon: '🔥', description: 'Feature-rich wallet with staking' },
    { name: 'Backpack', icon: '🎒', description: 'Modern wallet with social features' },
    { name: 'Glow', icon: '✨', description: 'Beautiful and secure wallet' },
    { name: 'Brave Wallet', icon: '🦁', description: 'Built into Brave browser' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Connect Your Wallet</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="tab-selector">
          <button 
            className={`tab-button ${activeTab === 'gmail' ? 'active' : ''}`}
            onClick={() => setActiveTab('gmail')}
          >
            <span className="tab-icon">📧</span>
            <span>Gmail Login</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'extension' ? 'active' : ''}`}
            onClick={() => setActiveTab('extension')}
          >
            <span className="tab-icon">🔌</span>
            <span>Wallet Extension</span>
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'gmail' ? (
            <div className="gmail-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg viewBox="0 0 24 24" className="gmail-icon">
                    <path fill="currentColor" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.5 4.64L12 9.548l6.5-4.908 1.573-1.147C21.69 2.28 24 3.434 24 5.457z"/>
                  </svg>
                </div>
                <h3>Sign in with Google</h3>
                <p>Secure, passwordless wallet creation with your Gmail account</p>
              </div>

              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="benefit-icon">🔒</span>
                  <div className="benefit-text">
                    <strong>No Seed Phrases</strong>
                    <p>Your wallet is securely generated from your Google account</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">⚡</span>
                  <div className="benefit-text">
                    <strong>Instant Access</strong>
                    <p>Access your wallet anywhere, anytime with just your Gmail</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🛡️</span>
                  <div className="benefit-text">
                    <strong>Bank-Level Security</strong>
                    <p>OAuth 2.0 authentication with Google's security</p>
                  </div>
                </div>
              </div>

              <button 
                className="gmail-connect-button"
                onClick={handleGmailSignIn}
                disabled={connectingWallet === 'gmail'}
              >
                {connectingWallet === 'gmail' ? (
                  <>
                    <div className="connecting-spinner"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="google-icon">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="security-note">
                <span className="security-icon">🔐</span>
                <p>Your private keys are generated deterministically and never stored on our servers</p>
              </div>
            </div>
          ) : (
            <div className="extension-section">
              <div className="section-header">
                <div className="section-icon">🔌</div>
                <h3>Connect Wallet Extension</h3>
                <p>Use your existing Solana wallet extension</p>
              </div>

              <div className="wallet-grid">
                {popularWallets.map((wallet) => {
                  const availableWallet = wallets.find(w => 
                    w.adapter.name.toLowerCase().includes(wallet.name.toLowerCase())
                  );
                  const isInstalled = availableWallet?.readyState === 'Installed';
                  const isConnecting = connectingWallet === availableWallet?.adapter.name;

                  return (
                    <button
                      key={wallet.name}
                      className={`wallet-option ${isInstalled ? 'installed' : 'not-installed'}`}
                      onClick={() => {
                        if (isInstalled && availableWallet) {
                          handleWalletConnect(availableWallet.adapter.name as WalletName);
                        } else {
                          // Open wallet website for installation
                          window.open(getWalletDownloadUrl(wallet.name), '_blank');
                        }
                      }}
                      disabled={isConnecting}
                    >
                      <div className="wallet-icon">{wallet.icon}</div>
                      <div className="wallet-info">
                        <h4>{wallet.name}</h4>
                        <p>{wallet.description}</p>
                      </div>
                      <div className="wallet-status">
                        {isConnecting ? (
                          <div className="connecting-spinner"></div>
                        ) : isInstalled ? (
                          <span className="status-badge installed">Installed</span>
                        ) : (
                          <span className="status-badge not-installed">Install</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="extension-note">
                <span className="note-icon">💡</span>
                <p>
                  Don't see your wallet? Make sure your wallet extension is installed and enabled.
                  You can also try refreshing the page.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-container {
          background: linear-gradient(145deg, #1e2334 0%, #252a41 100%);
          border-radius: 24px;
          width: 90vw;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 0 24px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #fff;
        }

        .close-button {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .tab-selector {
          display: flex;
          padding: 24px 24px 0 24px;
          gap: 8px;
        }

        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #94a3b8;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          justify-content: center;
        }

        .tab-button:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .tab-button.active {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-color: transparent;
          color: #fff;
        }

        .tab-icon {
          font-size: 16px;
        }

        .modal-content {
          padding: 24px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .section-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: white;
        }

        .gmail-icon {
          width: 32px;
          height: 32px;
        }

        .section-header h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: bold;
          color: #fff;
        }

        .section-header p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
        }

        .benefits-list {
          margin-bottom: 32px;
        }

        .benefit-item {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          align-items: flex-start;
        }

        .benefit-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .benefit-text strong {
          display: block;
          color: #fff;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .benefit-text p {
          margin: 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.4;
        }

        .gmail-connect-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 24px;
          background: #fff;
          border: 2px solid #dadce0;
          border-radius: 12px;
          color: #3c4043;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .gmail-connect-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
          transition: left 0.5s ease;
        }

        .gmail-connect-button:hover::before {
          left: 100%;
        }

        .gmail-connect-button:hover {
          border-color: #4285f4;
          box-shadow: 0 8px 24px rgba(66, 133, 244, 0.2);
          transform: translateY(-2px);
        }

        .gmail-connect-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .google-icon {
          width: 20px;
          height: 20px;
        }

        .connecting-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .security-note {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 16px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 12px;
        }

        .security-icon {
          font-size: 16px;
          color: #22c55e;
        }

        .security-note p {
          margin: 0;
          color: #22c55e;
          font-size: 12px;
          line-height: 1.4;
        }

        .wallet-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .wallet-option {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }

        .wallet-option:hover {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .wallet-option.installed {
          border-color: rgba(34, 197, 94, 0.3);
        }

        .wallet-option:disabled {
          cursor: not-allowed;
          opacity: 0.7;
          transform: none;
        }

        .wallet-icon {
          width: 40px;
          height: 40px;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .wallet-info {
          flex: 1;
          min-width: 0;
        }

        .wallet-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .wallet-info p {
          margin: 0;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.3;
        }

        .wallet-status {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.installed {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-badge.not-installed {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .extension-note {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 16px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 12px;
        }

        .note-icon {
          font-size: 16px;
          color: #f59e0b;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .extension-note p {
          margin: 0;
          color: #fbbf24;
          font-size: 12px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .modal-container {
            width: 95vw;
            margin: 20px;
          }

          .modal-header,
          .tab-selector,
          .modal-content {
            padding: 20px 16px;
          }

          .tab-selector {
            padding-top: 16px;
          }

          .modal-content {
            padding-top: 20px;
          }

          .section-icon {
            width: 48px;
            height: 48px;
            font-size: 24px;
          }

          .gmail-icon {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>
    </div>
  );
}

// Helper function to get wallet download URLs
function getWalletDownloadUrl(walletName: string): string {
  const urls: Record<string, string> = {
    'Phantom': 'https://phantom.app/',
    'Solflare': 'https://solflare.com/',
    'Backpack': 'https://backpack.app/',
    'Glow': 'https://glow.app/',
    'Brave Wallet': 'https://brave.com/wallet/',
  };
  return urls[walletName] || 'https://solana.com/ecosystem/explore?categories=wallet';
}
