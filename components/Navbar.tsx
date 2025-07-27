import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletWrapper from './WalletWrapper';

function WalletSection() {
  const { publicKey, disconnect, select, wallets, connect, connecting, connected, wallet } = useWallet();
  const [customConnecting, setCustomConnecting] = useState(false);
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

  const handleConnectWallet = useCallback(async () => {
    if (connecting || customConnecting) return;

    setCustomConnecting(true);
    
    try {
      console.log('Attempting wallet connection...');
      console.log('Available wallets:', wallets.map(w => w.adapter.name));
      
      // Check if user is on mobile
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('Mobile detected, opening Phantom app...');
        // For mobile, use deep linking to Phantom app
        const currentUrl = encodeURIComponent(window.location.href);
        const phantomUrl = `https://phantom.app/ul/browse/${currentUrl}?ref=${encodeURIComponent(window.location.origin)}`;
        window.location.href = phantomUrl;
        return;
      }

      // For desktop, try to connect with Phantom wallet adapter
      const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
      
      if (phantomWallet) {
        console.log('Phantom wallet found, attempting connection...');
        select(phantomWallet.adapter.name);
        
        // Wait a moment for selection to take effect
        setTimeout(async () => {
          try {
            await connect();
            console.log('Connected successfully via wallet adapter');
          } catch (connectError) {
            console.error('Wallet adapter connection failed:', connectError);
            
            // Try direct connection as fallback
            try {
              const phantom = (window as any).phantom?.solana;
              if (phantom) {
                console.log('Trying direct Phantom connection...');
                await phantom.connect();
                console.log('Direct connection successful');
              } else {
                throw new Error('Phantom not found');
              }
            } catch (directError) {
              console.error('Direct connection failed:', directError);
              alert('Failed to connect to Phantom wallet. Please make sure Phantom is installed and try again.');
            }
          }
        }, 100);
      } else {
        console.log('Phantom wallet not found in adapters');
        
        // Check if Phantom extension is available for direct connection
        const phantom = (window as any).phantom?.solana;
        if (phantom) {
          console.log('Phantom extension found, trying direct connection...');
          try {
            await phantom.connect();
            console.log('Direct connection successful');
          } catch (error) {
            console.error('Direct connection failed:', error);
            alert('Failed to connect to Phantom wallet.');
          }
        } else {
          alert('Phantom wallet not found. Please install Phantom browser extension or use Phantom mobile app.');
        }
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      alert(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
    } finally {
      setCustomConnecting(false);
    }
  }, [wallets, select, connect, connecting, customConnecting]);

  // Auto-retry connection if wallet gets disconnected unexpectedly
  useEffect(() => {
    if (!connected && !connecting && !customConnecting && wallet) {
      console.log('Wallet disconnected unexpectedly, attempting reconnection...');
      const timer = setTimeout(() => {
        handleConnectWallet();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [connected, connecting, customConnecting, wallet, handleConnectWallet]);

  return (
    <div className="navbar-right">
      {!connected ? (
        <div className="single-wallet-button">
          <WalletMultiButton />
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
