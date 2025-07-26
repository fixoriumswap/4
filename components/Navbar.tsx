import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletWrapper from './WalletWrapper';
import WalletConnect from './WalletConnect';
import TrendingTokens from './TrendingTokens';

function WalletSection() {
  const { publicKey, disconnect } = useWallet();
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const address = publicKey?.toBase58();

  function shortAddr(addr: string) {
    return addr ? `${addr.slice(0,4)}...${addr.slice(-4)}` : '';
  }

  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address);
      alert('Address copied to clipboard!');
    }
  }

  const handleConnectWallet = () => {
    setShowWalletConnect(true);
  };

  return (
    <>
      <div className="navbar-right">
        {/* Trending button */}
        <button 
          className="trending-btn"
          onClick={() => setShowTrending(true)}
          title="Trending Tokens"
        >
          📈 Trending
        </button>

        {/* Wallet section */}
        {!publicKey ? (
          <button
            className="connect-wallet-btn"
            onClick={handleConnectWallet}
          >
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-connected">
            <span className="wallet-address" title={address}>
              {shortAddr(address!)}
            </span>
            <button className="copy-btn" onClick={copyAddress}>
              Copy
            </button>
            <button className="disconnect-btn" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showWalletConnect && (
        <WalletConnect onClose={() => setShowWalletConnect(false)} />
      )}
      
      {showTrending && (
        <TrendingTokens onClose={() => setShowTrending(false)} />
      )}
    </>
  );
}

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="logo-title-wrap">
            <svg className="navbar-logo" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="32" fill="#29D6B6"/>
              <text x="32" y="42" textAnchor="middle" fontSize="28" fill="#23272F" fontFamily="Arial" fontWeight="bold">F</text>
            </svg>
            <span className="navbar-title">FIXORIUM</span>
          </div>
        </div>

        <WalletWrapper>
          <WalletSection />
        </WalletWrapper>
      </div>
    </nav>
  );
}
