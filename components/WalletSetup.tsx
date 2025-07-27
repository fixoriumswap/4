import React, { useState } from 'react';
import { useFixoriumWallet } from '../context/FixoriumWallet';

export default function WalletSetup() {
  const { signInWithGoogle, loading } = useFixoriumWallet();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWallet = async () => {
    setIsCreating(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRecoverWallet = async () => {
    setIsCreating(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error recovering wallet:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="wallet-setup-container">
      <div className="setup-content">
        <div className="setup-header">
          <div className="fixorium-brand">
            <svg viewBox="0 0 64 64" className="brand-logo">
              <circle cx="32" cy="32" r="32" fill="#29D6B6"/>
              <text x="32" y="42" textAnchor="middle" fontSize="28" fill="#23272F" fontFamily="Arial" fontWeight="bold">F</text>
            </svg>
            <h1>FIXORIUM</h1>
          </div>
          <p className="setup-subtitle">Solana & Pump.fun Wallet</p>
        </div>

        <div className="setup-options">
          <div className="single-option-card">
            <h2>Access Your Wallet</h2>
            <p>Use your Gmail account to create a new wallet or recover an existing one. One Gmail = One permanent wallet address.</p>

            <div className="action-buttons">
              <button
                className="setup-button create-button"
                onClick={handleCreateWallet}
                disabled={isCreating || loading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                {isCreating ? 'Processing...' : 'Create New Wallet'}
              </button>

              <button
                className="setup-button recover-button"
                onClick={handleRecoverWallet}
                disabled={isCreating || loading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
                {isCreating ? 'Processing...' : 'Recover Wallet'}
              </button>
            </div>
          </div>
        </div>

        <div className="setup-footer">
          <div className="security-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p>Your wallet is secured with Gmail authentication. One account creates one permanent address.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
