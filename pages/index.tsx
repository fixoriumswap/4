import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import FixoriumBottomBar from '../components/FixoriumBottomBar';
import CryptoLoader from '../components/CryptoLoader';
import WalletSetup from '../components/WalletSetup';
import SwapInterface from '../components/SwapInterface';
import { useFixoriumWallet } from '../context/FixoriumWallet';

export default function Home() {
  const { isAuthenticated, loading } = useFixoriumWallet();
  const [showSetup, setShowSetup] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#181a20', color: '#fff', paddingBottom: isAuthenticated ? '120px' : '20px' }} suppressHydrationWarning>
      <Navbar />
      
      <main>
        {loading ? (
          <div className="page-loading">
            <CryptoLoader />
          </div>
        ) : !isAuthenticated ? (
          showSetup ? (
            <div className="setup-page">
              <WalletSetup />
            </div>
          ) : (
            <div className="welcome-page">
              <CryptoLoader onComplete={() => setShowSetup(true)} />
            </div>
          )
        ) : (
          <div className="app-interface">
            <SwapInterface />
          </div>
        )}
      </main>

      {isAuthenticated && <FixoriumBottomBar />}
    </div>
  );
}
