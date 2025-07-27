import React from 'react';
import { useFixoriumWallet } from '../context/FixoriumWallet';

export default function Navbar() {
  const { user, isAuthenticated, loading, signInWithGoogle, signOut } = useFixoriumWallet();

  const shortAddr = (addr: string) => {
    return addr ? `${addr.slice(0,4)}...${addr.slice(-4)}` : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="logo-title-wrap">
            <svg className="navbar-logo" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="32" fill="#29D6B6"/>
              <text x="32" y="42" textAnchor="middle" fontSize="28" fill="#23272F" fontFamily="Arial" fontWeight="bold">F</text>
            </svg>
            <span className="navbar-title">FIXORIUM WALLET</span>
          </div>
        </div>

        <div className="navbar-right">
          {loading ? (
            <div className="loading-wallet">
              <span className="spinner" />
              <span>Loading...</span>
            </div>
          ) : !isAuthenticated ? (
            <button
              className="gmail-signin-btn"
              onClick={signInWithGoogle}
            >
              📧 Sign in with Gmail
            </button>
          ) : (
            <div className="user-info">
              <div className="user-details">
                <span className="user-email">{user?.email}</span>
                <span className="wallet-address" title={user?.publicKey}>
                  {shortAddr(user?.publicKey || '')}
                </span>
              </div>
              <button className="signout-btn" onClick={signOut}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
