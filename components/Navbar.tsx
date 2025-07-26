import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletWrapper from './WalletWrapper';
import { detectPhantomWallet, openPhantomDownload, isMobileDevice } from '../utils/walletDetection';

function WalletSection() {
  const { publicKey, disconnect, select, wallets, connect } = useWallet();
  const [isPhantomDetected, setIsPhantomDetected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const address = publicKey?.toBase58();

  useEffect(() => {
    setIsPhantomDetected(detectPhantomWallet());
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

  async function handleConnectWallet() {
    if (connecting) return;

    setConnecting(true);
    try {
      if (isPhantomDetected) {
        // Try to connect to Phantom browser extension
        const phantomWallet = wallets.find(wallet => wallet.adapter.name === 'Phantom');
        if (phantomWallet) {
          select(phantomWallet.adapter.name);
          await connect();
        }
      } else {
        // Handle case when Phantom is not detected
        if (isMobileDevice()) {
          // For mobile, try to open Phantom app with deep link
          const currentUrl = window.location.href;
          const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(window.location.origin)}`;

          // Try to open Phantom app, fallback to app store
          const phantomApp = window.open(phantomUrl, '_blank');

          // If popup was blocked or app not installed, show install option
          setTimeout(() => {
            if (!phantomApp || phantomApp.closed) {
              if (confirm('Phantom app not found. Would you like to install it?')) {
                openPhantomDownload();
              }
            }
          }, 3000);
        } else {
          // For desktop, prompt to install Phantom extension
          if (confirm('Phantom wallet extension not detected. Would you like to install it?')) {
            openPhantomDownload();
          }
        }
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  }

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
