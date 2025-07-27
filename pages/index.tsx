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
    <div style={{ minHeight: '100vh', background: '#181a20', color: '#fff', paddingBottom: '120px' }} suppressHydrationWarning>
      <Navbar />
      
      <main>
        {loading ? (
          <div className="page-loading">
            <CryptoLoader />
          </div>
        ) : !isAuthenticated ? (
          <div className="welcome-page">
            <CryptoLoader />
          </div>
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
