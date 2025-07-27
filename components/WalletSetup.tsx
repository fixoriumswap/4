import React, { useState } from 'react';
import SignUp from './SignUp';
import SignIn from './SignIn';
import PasswordRecovery from './PasswordRecovery';

type AuthView = 'options' | 'signup' | 'signin' | 'recovery';

export default function WalletSetup() {
  const [currentView, setCurrentView] = useState<AuthView>('options');

  const handleAuthSuccess = () => {
    // The parent component will handle the authentication success
    // by checking the authentication state in the context
  };

  if (currentView === 'signup') {
    return (
      <SignUp
        onSuccess={handleAuthSuccess}
        onBackToOptions={() => setCurrentView('options')}
      />
    );
  }

  if (currentView === 'signin') {
    return (
      <SignIn
        onSuccess={handleAuthSuccess}
        onBackToOptions={() => setCurrentView('options')}
        onForgotPassword={() => setCurrentView('recovery')}
      />
    );
  }

  if (currentView === 'recovery') {
    return (
      <PasswordRecovery
        onSuccess={handleAuthSuccess}
        onBackToSignIn={() => setCurrentView('signin')}
      />
    );
  }

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
            <h2>Welcome to Fixorium</h2>
            <p>Create a new account or sign in to access your wallet. Your account is secured with email, password, and mobile verification.</p>
            
            <div className="action-buttons">
              <button 
                className="setup-button create-button"
                onClick={() => setCurrentView('signup')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Create New Account
              </button>
              
              <button 
                className="setup-button recover-button"
                onClick={() => setCurrentView('signin')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
                Sign In to Account
              </button>
            </div>
          </div>
        </div>

        <div className="setup-footer">
          <div className="security-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p>Your wallet is secured with multi-factor authentication including mobile verification.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
