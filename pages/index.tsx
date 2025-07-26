import React from 'react';
import Navbar from '../components/Navbar';
import TokenBalances from '../components/TokenBalances';
import SwapForm from '../components/SwapForm';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <div style={{ minHeight: '100vh', background: '#181a20', color: '#fff' }} suppressHydrationWarning>
      <Navbar />
      <main>
        {publicKey && <TokenBalances />}
        <SwapForm />
      </main>
    </div>
  );
}
