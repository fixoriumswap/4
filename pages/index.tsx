import React from 'react';
import Header from '../components/Header';
import TokenBalances from '../components/TokenBalances';
import SwapForm from '../components/SwapForm';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <>
      <Header />
      <main>
        {publicKey && <TokenBalances />}
        <SwapForm />
      </main>
    </>
  );
}
