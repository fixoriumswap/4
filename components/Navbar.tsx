import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletWrapper from './WalletWrapper';

function WalletSection() {
  const { publicKey, disconnect, select, wallets, connect } = useWallet();
  const [connecting, setConnecting] = useState(false);
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

  const detectPhantomExtension = () => {
    return !!(window as any).phantom?.solana;
  };

  const isMobile = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
           window.innerWidth <= 768;
  };

  const handleConnectWallet = async () => {
    if (connecting) return;

    setConnecting(true);
    
    try {
      const hasPhantomExtension = detectPhantomExtension();
      const isOnMobile = isMobile();

      if (hasPhantomExtension) {
        // Browser extension detected - connect directly
        console.log('Phantom extension detected, connecting...');
        
        try {
          const phantom = (window as any).phantom?.solana;
          if (phantom) {
            await phantom.connect();
            console.log('Connected via Phantom extension');
          }
        } catch (extensionError) {
          console.error('Extension connection failed:', extensionError);
          // Fallback to wallet adapter
          const phantomWallet = wallets.find(wallet => wallet.adapter.name === 'Phantom');
          if (phantomWallet) {
            select(phantomWallet.adapter.name);
            await connect();
          }
        }
      } else {
        // No extension detected - open mobile app directly
        console.log('No extension detected, opening mobile app...');
        
        const currentUrl = window.location.href;
        const phantomDeepLink = `phantom://browse/${encodeURIComponent(currentUrl)}`;
        const phantomUniversalLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(window.location.origin)}`;
        
        // Try deep link first for mobile
        if (isOnMobile) {
          console.log('Mobile detected, using deep link...');
          window.location.href = phantomDeepLink;
          
          // Fallback to universal link after delay
          setTimeout(() => {
            if (document.hidden) {
              // User likely switched to Phantom app
              console.log('User switched to Phantom app');
            } else {
              // Deep link failed, try universal link
              window.location.href = phantomUniversalLink;
            }
          }, 2000);
        } else {
          // Desktop without extension - redirect to universal link
          console.log('Desktop without extension, using universal link...');
          window.location.href = phantomUniversalLink;
        }
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      alert(`Failed to connect wallet: ${error.message || 'Please try again.'}`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="navbar-right">
      {!publicKey ? (
        <button
          className="connect-wallet-btn"
          onClick={handleConnectWallet}
          disabled={connecting}
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
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
