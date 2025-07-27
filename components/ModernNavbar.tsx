import React, { useState } from 'react';
import { useWalletContext } from './WalletContext';
import { PublicKey } from '@solana/web3.js';

interface ModernNavbarProps {
  onConnectWallet: () => void;
  isConnected: boolean;
  connectionType: 'mobile' | null;
  publicKey: PublicKey | null;
}

export default function ModernNavbar({
  onConnectWallet,
  isConnected,
  connectionType,
  publicKey
}: ModernNavbarProps) {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    signOut({ callbackUrl: '/auth/signin' });
    setShowDropdown(false);
  };

  const getConnectionIcon = () => {
    return (
      <svg viewBox="0 0 24 24" className="connection-icon">
        <path fill="currentColor" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.5 4.64L12 9.548l6.5-4.908 1.573-1.147C21.69 2.28 24 3.434 24 5.457z"/>
      </svg>
    );
  };

  return (
    <nav className="modern-navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="logo-section">
            <div className="navbar-logo">
              <svg viewBox="0 0 64 64" className="logo-svg">
                <defs>
                  <linearGradient id="navLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="50%" stopColor="#764ba2" />
                    <stop offset="100%" stopColor="#f093fb" />
                  </linearGradient>
                  <filter id="navGlow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="32" cy="32" r="28" fill="url(#navLogoGradient)" filter="url(#navGlow)" />
                <path
                  d="M20 24 L32 14 L44 24 L44 34 L32 44 L20 34 Z"
                  fill="rgba(255,255,255,0.9)"
                />
                <circle cx="32" cy="29" r="8" fill="url(#navLogoGradient)" />
              </svg>
            </div>
            <div className="navbar-title">
              <span className="title-main">Solana</span>
              <span className="title-sub">Wallet</span>
            </div>
          </div>
        </div>

        <div className="navbar-right">
          {!isConnected ? (
            <button className="connect-button" onClick={onConnectWallet}>
              <span className="connect-icon">🚀</span>
              <span>Connect Wallet</span>
            </button>
          ) : (
            <div className="wallet-info">
              <div className="wallet-status">
                <div className="status-indicator">
                  <div className="status-dot"></div>
                  <span className="status-text">Connected</span>
                </div>
                <div className="connection-type">
                  {getConnectionIcon()}
                  <span>Gmail</span>
                </div>
              </div>
              
              <div className="wallet-details" onClick={() => setShowDropdown(!showDropdown)}>
                <div className="wallet-avatar">
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="User" className="user-avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {session?.user?.name ? session.user.name.charAt(0) : '👤'}
                    </div>
                  )}
                </div>
                <div className="wallet-text">
                  <div className="wallet-name">
                    {session?.user?.name || 'Wallet'}
                  </div>
                  <div className="wallet-address">
                    {publicKey ? formatAddress(publicKey.toString()) : 'Loading...'}
                  </div>
                </div>
                <div className="dropdown-arrow">▼</div>
              </div>

              {showDropdown && (
                <div className="wallet-dropdown">
                  <div className="dropdown-item" onClick={copyAddress}>
                    <span className="dropdown-icon">📋</span>
                    <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                  </div>
                  <div className="dropdown-item">
                    <span className="dropdown-icon">🔗</span>
                    <span>View on Explorer</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item disconnect" onClick={handleDisconnect}>
                    <span className="dropdown-icon">🔌</span>
                    <span>Disconnect</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modern-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(30px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          z-index: 1000;
          height: 80px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .navbar-content {
          max-width: 1400px;
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
          position: relative;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logo-section:hover {
          transform: scale(1.05);
        }

        .navbar-logo {
          width: 48px;
          height: 48px;
          position: relative;
        }

        .logo-svg {
          width: 100%;
          height: 100%;
          animation: logoSpin 20s linear infinite;
        }

        @keyframes logoSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .navbar-title {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .title-main {
          font-size: 20px;
          font-weight: 800;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .title-sub {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          margin-top: -2px;
        }

        .connect-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .connect-button:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .connect-icon {
          font-size: 16px;
        }

        .wallet-info {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
        }

        .wallet-status {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-end;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }

        .status-text {
          font-size: 10px;
          font-weight: 600;
          color: #22c55e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .connection-type {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .connection-icon {
          width: 12px;
          height: 12px;
        }

        .wallet-details {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 200px;
        }

        .wallet-details:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .wallet-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .user-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .wallet-text {
          flex: 1;
          min-width: 0;
        }

        .wallet-name {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wallet-address {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.8);
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 500;
        }

        .dropdown-arrow {
          color: rgba(255, 255, 255, 0.6);
          font-size: 10px;
          transition: transform 0.3s ease;
        }

        .wallet-details:hover .dropdown-arrow {
          transform: rotate(180deg);
        }

        .wallet-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: rgba(30, 35, 52, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          min-width: 200px;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          animation: dropdownFadeIn 0.2s ease-out;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .dropdown-item:first-child {
          border-radius: 16px 16px 0 0;
        }

        .dropdown-item:last-child {
          border-radius: 0 0 16px 16px;
        }

        .dropdown-item.disconnect {
          color: #ef4444;
        }

        .dropdown-item.disconnect:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }

        .dropdown-icon {
          font-size: 14px;
          width: 16px;
          text-align: center;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 4px 0;
        }

        @media (max-width: 768px) {
          .navbar-content {
            padding: 0 16px;
          }

          .navbar-title {
            display: none;
          }

          .wallet-details {
            min-width: auto;
            padding: 8px 12px;
          }

          .wallet-text {
            display: none;
          }

          .status-indicator,
          .connection-type {
            display: none;
          }

          .connect-button {
            padding: 10px 16px;
            font-size: 12px;
          }
        }
      `}</style>
    </nav>
  );
}
