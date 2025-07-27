import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Navbar() {
  const { publicKey, disconnect, connected, connecting, wallet } = useWallet();
  const [copied, setCopied] = useState(false);

  const address = publicKey?.toBase58();

  function shortAddr(addr: string) {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  }

  async function copyAddress() {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const getWalletIcon = () => {
    if (!wallet?.adapter?.icon) return '🔐';
    return wallet.adapter.icon;
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="logo-section">
            <div className="navbar-logo">
              <svg viewBox="0 0 64 64" className="logo-svg">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="32" r="30" fill="url(#logoGradient)" />
                <path
                  d="M20 25 L32 15 L44 25 L44 35 L32 45 L20 35 Z"
                  fill="white"
                  opacity="0.9"
                />
                <circle cx="32" cy="30" r="8" fill="url(#logoGradient)" />
              </svg>
            </div>
            <div className="navbar-title">Solana Wallet</div>
          </div>
        </div>

        <div className="navbar-right">
          {!connected ? (
            <div className="wallet-connection">
              <WalletMultiButton className="wallet-multi-button" />
            </div>
          ) : (
            <div className="wallet-connected">
              <div className="wallet-info">
                <div className="wallet-details">
                  {wallet?.adapter?.icon && (
                    <img 
                      src={wallet.adapter.icon} 
                      alt={wallet.adapter.name}
                      className="wallet-icon"
                    />
                  )}
                  <div className="wallet-text">
                    <div className="wallet-name">{wallet?.adapter?.name || 'Unknown'}</div>
                    <div className="wallet-address" title={address}>
                      {shortAddr(address!)}
                    </div>
                  </div>
                </div>
                <div className="wallet-actions">
                  <button 
                    className="action-btn copy-btn" 
                    onClick={copyAddress}
                    title="Copy wallet address"
                  >
                    {copied ? '✅' : '📋'}
                  </button>
                  <button 
                    className="action-btn disconnect-btn" 
                    onClick={handleDisconnect}
                    title="Disconnect wallet"
                  >
                    🔌
                  </button>
                </div>
              </div>
              
              <div className="connection-status">
                <div className="status-indicator">
                  <div className="status-dot"></div>
                  <span className="status-text">Connected</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 1000;
          height: 80px;
        }

        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-left {
          display: flex;
          align-items: center;
        }

        .navbar-right {
          display: flex;
          align-items: center;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .navbar-logo {
          width: 48px;
          height: 48px;
        }

        .logo-svg {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .navbar-title {
          font-size: 24px;
          font-weight: bold;
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: none;
        }

        @media (min-width: 768px) {
          .navbar-title {
            display: block;
          }
        }

        .wallet-connection {
          display: flex;
          align-items: center;
        }

        .wallet-connected {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }

        .wallet-info {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 12px 16px;
          backdrop-filter: blur(10px);
        }

        .wallet-details {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .wallet-icon {
          width: 24px;
          height: 24px;
          border-radius: 4px;
        }

        .wallet-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .wallet-name {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .wallet-address {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 14px;
          color: #60a5fa;
          font-weight: 600;
        }

        .wallet-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .copy-btn {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .copy-btn:hover {
          background: rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
        }

        .disconnect-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .disconnect-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          transform: translateY(-1px);
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 8px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .status-text {
          font-size: 11px;
          font-weight: 600;
          color: #22c55e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        /* Override wallet adapter button styles */
        :global(.wallet-adapter-button) {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
          border: none !important;
          border-radius: 12px !important;
          padding: 12px 24px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          color: white !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
        }

        :global(.wallet-adapter-button:hover) {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4) !important;
        }

        :global(.wallet-adapter-button-loading) {
          background: rgba(59, 130, 246, 0.5) !important;
        }

        :global(.wallet-multi-button) {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .navbar-content {
            padding: 0 16px;
          }

          .wallet-connected {
            align-items: center;
          }

          .wallet-info {
            padding: 10px 12px;
          }

          .wallet-text {
            display: none;
          }

          .wallet-details {
            gap: 8px;
          }

          .connection-status {
            display: none;
          }

          .logo-section {
            gap: 12px;
          }

          .navbar-logo {
            width: 40px;
            height: 40px;
          }
        }

        @media (max-width: 480px) {
          .wallet-info {
            padding: 8px 10px;
          }

          .action-btn {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }

          .wallet-actions {
            gap: 6px;
          }
        }
      `}</style>
    </nav>
  );
}
