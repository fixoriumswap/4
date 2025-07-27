import React from 'react';
import Navbar from '../components/Navbar';
import BalanceContainer from '../components/BalanceContainer';
import SwapForm from '../components/SwapForm';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { publicKey, connected } = useWallet();

  return (
    <div style={{ minHeight: '100vh', background: '#181a20', color: '#fff' }} suppressHydrationWarning>
      <Navbar />
      <main>
        {publicKey && connected && <BalanceContainer />}
        <SwapForm />
      </main>
    </div>
  );
}
