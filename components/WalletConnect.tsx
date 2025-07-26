import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface WalletConnectProps {
  onClose: () => void;
}

export default function WalletConnect({ onClose }: WalletConnectProps) {
  const { connected, connecting, publicKey, select, wallet, disconnect } = useWallet();
  const [hasPhantomExtension, setHasPhantomExtension] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');

  useEffect(() => {
    // Check if running on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
             window.innerWidth <= 768;
    };

    setIsMobile(checkMobile());

    // Check for Phantom browser extension
    const checkPhantomExtension = () => {
      return !!(window as any).phantom?.solana;
    };

    setHasPhantomExtension(checkPhantomExtension());

    // Listen for Phantom extension installation
    const handlePhantomReady = () => {
      setHasPhantomExtension(true);
    };

    window.addEventListener('phantom#initialized', handlePhantomReady);
    
    return () => {
      window.removeEventListener('phantom#initialized', handlePhantomReady);
    };
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      setConnectionStatus(`✅ Connected: ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [connected, publicKey, onClose]);

  const connectBrowserWallet = async () => {
    if (!hasPhantomExtension) {
      setConnectionStatus('❌ Phantom extension not found. Please install from phantom.app');
      return;
    }

    try {
      setConnectionStatus('🔄 Connecting to Phantom browser extension...');
      
      // Select Phantom wallet adapter
      const phantomAdapter = (window as any).phantom?.solana;
      if (phantomAdapter) {
        await phantomAdapter.connect();
        setConnectionStatus('✅ Connected successfully!');
      }
    } catch (error: any) {
      console.error('Browser wallet connection error:', error);
      setConnectionStatus(`❌ Connection failed: ${error.message || 'Unknown error'}`);
    }
  };

  const connectMobileWallet = () => {
    try {
      setConnectionStatus('📱 Opening Phantom mobile app...');
      
      // Create deep link for mobile Phantom
      const appUrl = `phantom://browse/${window.location.href}`;
      const fallbackUrl = 'https://phantom.app/download';
      
      // Try to open Phantom mobile app
      window.location.href = appUrl;
      
      // Fallback to download page after a delay
      setTimeout(() => {
        if (document.hidden) {
          // User likely switched to Phantom app
          setConnectionStatus('📱 Please complete connection in Phantom app and return here');
        } else {
          // App not installed, redirect to download
          setConnectionStatus('📱 Phantom app not found. Redirecting to download...');
          window.open(fallbackUrl, '_blank');
        }
      }, 3000);

    } catch (error: any) {
      console.error('Mobile wallet connection error:', error);
      setConnectionStatus(`❌ Mobile connection failed: ${error.message || 'Unknown error'}`);
    }
  };

  const installPhantomExtension = () => {
    window.open('https://phantom.app/download', '_blank');
    setConnectionStatus('🔄 Please install Phantom extension and refresh this page');
  };

  if (connected) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content wallet-connect-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>✅ Wallet Connected</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="connected-info">
            <div className="wallet-icon">👛</div>
            <h3>Successfully Connected!</h3>
            <div className="connected-address">
              {publicKey?.toString()}
            </div>
            <button className="disconnect-btn-modal" onClick={() => { disconnect(); onClose(); }}>
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wallet-connect-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Connect Wallet</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="wallet-options">
          <div className="device-detection">
            <p>Choose your connection method:</p>
            <div className="device-info">
              📱 Mobile: {isMobile ? 'Detected' : 'Not detected'} | 
              🖥️ Browser Extension: {hasPhantomExtension ? 'Installed' : 'Not installed'}
            </div>
          </div>

          <div className="wallet-buttons">
            {/* Browser Extension Option */}
            <div className="wallet-option">
              <div className="option-header">
                <img 
                  src="https://phantom.app/img/phantom-icon.svg" 
                  alt="Phantom" 
                  className="wallet-logo"
                />
                <div>
                  <h3>Phantom Browser Extension</h3>
                  <p>Connect using browser extension</p>
                </div>
              </div>
              
              {hasPhantomExtension ? (
                <button 
                  className="connect-option-btn browser"
                  onClick={connectBrowserWallet}
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <span className="spinner" /> Connecting...
                    </>
                  ) : (
                    <>
                      🖥️ Connect Browser Wallet
                    </>
                  )}
                </button>
              ) : (
                <button 
                  className="install-btn"
                  onClick={installPhantomExtension}
                >
                  📥 Install Phantom Extension
                </button>
              )}
            </div>

            {/* Mobile Wallet Option */}
            <div className="wallet-option">
              <div className="option-header">
                <img 
                  src="https://phantom.app/img/phantom-icon.svg" 
                  alt="Phantom Mobile" 
                  className="wallet-logo"
                />
                <div>
                  <h3>Phantom Mobile App</h3>
                  <p>Connect using mobile app</p>
                </div>
              </div>
              
              <button 
                className="connect-option-btn mobile"
                onClick={connectMobileWallet}
              >
                📱 Open Phantom Mobile
              </button>
            </div>

            {/* Default Wallet Adapter (Fallback) */}
            <div className="wallet-option">
              <div className="option-header">
                <div className="generic-wallet-icon">👛</div>
                <div>
                  <h3>Other Wallets</h3>
                  <p>Solflare, Backpack, and more</p>
                </div>
              </div>
              
              <div className="wallet-adapter-wrapper">
                <WalletMultiButton />
              </div>
            </div>
          </div>

          {connectionStatus && (
            <div className="connection-status">
              {connectionStatus}
            </div>
          )}

          <div className="security-notice">
            <h4>🔒 Security Tips:</h4>
            <ul>
              <li>Only download Phantom from official sources</li>
              <li>Never share your seed phrase with anyone</li>
              <li>Always verify transaction details before signing</li>
              <li>Use hardware wallets for large amounts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
