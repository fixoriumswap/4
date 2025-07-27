import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletWrapper from './WalletWrapper';

function WalletSection() {
  const { publicKey, disconnect, select, wallets, connect, wallet } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [hasPhantomExtension, setHasPhantomExtension] = useState(false);
  const address = publicKey?.toBase58();

  useEffect(() => {
    // Check for Phantom extension on mount and periodically
    const checkPhantomExtension = () => {
      const phantom = (window as any).phantom?.solana;
      const isInstalled = !!(phantom && phantom.isPhantom);
      setHasPhantomExtension(isInstalled);
      console.log('Phantom extension check:', isInstalled);
      return isInstalled;
    };

    // Initial check
    checkPhantomExtension();

    // Check again after a short delay (for extension loading)
    const timeoutId = setTimeout(checkPhantomExtension, 1000);

    // Listen for Phantom extension initialization
    const handlePhantomReady = () => {
      console.log('Phantom extension ready');
      checkPhantomExtension();
    };

    window.addEventListener('phantom#initialized', handlePhantomReady);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('phantom#initialized', handlePhantomReady);
    };
  }, []);

  function shortAddr(addr: string) {
    return addr ? `${addr.slice(0,4)}...${addr.slice(-4)}` : '';
  }

  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address);
      alert('Address copied to clipboard!');
    }
  }

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
      console.log('Attempting wallet connection...');
      console.log('Has Phantom Extension:', hasPhantomExtension);
      console.log('Is Mobile:', isMobile());

      if (hasPhantomExtension) {
        // Browser extension detected - use wallet adapter
        console.log('Using browser extension connection...');
        
        try {
          // Find Phantom wallet in the available wallets
          const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
          
          if (phantomWallet) {
            console.log('Phantom wallet found in adapter, selecting...');
            select(phantomWallet.adapter.name);
            
            // Wait a moment for selection to take effect
            setTimeout(async () => {
              try {
                await connect();
                console.log('Connected via wallet adapter');
              } catch (connectError) {
                console.error('Wallet adapter connect failed:', connectError);
                // Try direct Phantom connection as fallback
                await connectDirectly();
              }
            }, 500);
          } else {
            console.log('Phantom wallet not found in adapter, trying direct connection');
            await connectDirectly();
          }
        } catch (error) {
          console.error('Extension connection failed:', error);
          await connectDirectly();
        }
      } else {
        // No extension detected - open mobile app
        console.log('No extension detected, opening mobile app...');
        await openMobileApp();
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      alert(`Failed to connect wallet: ${error.message || 'Please try again.'}`);
    } finally {
      setConnecting(false);
    }
  };

  const connectDirectly = async () => {
    try {
      const phantom = (window as any).phantom?.solana;
      if (phantom) {
        console.log('Attempting direct Phantom connection...');
        const response = await phantom.connect({ onlyIfTrusted: false });
        console.log('Direct connection response:', response);
        
        // The wallet adapter should automatically detect this connection
        if (response.publicKey) {
          console.log('Direct connection successful');
        }
      } else {
        throw new Error('Phantom extension not available');
      }
    } catch (error) {
      console.error('Direct connection failed:', error);
      throw error;
    }
  };

  const openMobileApp = async () => {
    const currentUrl = window.location.href;
    const isOnMobile = isMobile();
    
    if (isOnMobile) {
      // Mobile device - use deep link
      const phantomDeepLink = `phantom://browse/${encodeURIComponent(currentUrl)}`;
      console.log('Opening Phantom mobile app with deep link...');
      
      try {
        window.location.href = phantomDeepLink;
        
        // Set up listener for when user returns to the page
        setTimeout(() => {
          if (!document.hidden) {
            // User is still on our page, app might not be installed
            const phantomUniversalLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(window.location.origin)}`;
            window.location.href = phantomUniversalLink;
          }
        }, 3000);
      } catch (error) {
        console.error('Mobile app opening failed:', error);
        throw error;
      }
    } else {
      // Desktop without extension - redirect to download page
      console.log('Desktop without extension, redirecting to download...');
      const downloadUrl = 'https://phantom.app/download';
      window.open(downloadUrl, '_blank');
      alert('Please install Phantom browser extension and refresh this page');
    }
  };

  return (
    <div className="navbar-right">
      {!publicKey ? (
        <div className="wallet-connection-options">
          <button
            className="connect-wallet-btn"
            onClick={handleConnectWallet}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          
          {/* Fallback wallet adapter button (hidden by default) */}
          <div className="wallet-adapter-fallback" style={{ display: 'none' }}>
            <WalletMultiButton />
          </div>
        </div>
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
