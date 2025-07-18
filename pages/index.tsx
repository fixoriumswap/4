 import React, { useState } from 'react';
import Header from '../components/Header';
import WalletBar from '../components/WalletBar';
import TokenBalances from '../components/TokenBalances';
import SwapForm from '../components/SwapForm';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Home() {
  const { publicKey } = useWallet();
  const [showWalletBar, setShowWalletBar] = useState(true);

  function handleDisconnect() {
    setShowWalletBar(false);
    setTimeout(() => setShowWalletBar(true), 300); // Allow re-render
  }

  return (
    <>
      <Header />
      <main>
        <div style={{display: "flex", justifyContent: "flex-end", marginTop: "18px"}}>
          {!publicKey && <WalletMultiButton />}
          {/* WalletBar shows only when connected */}
          {publicKey && showWalletBar && <WalletBar onDisconnect={handleDisconnect} />}
        </div>
        {publicKey && <TokenBalances />}
        <SwapForm />
      </main>
    </>
  );
          }
