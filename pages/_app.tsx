import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

export default function App({ Component, pageProps }: AppProps) {
  const wallets = [new PhantomWalletAdapter()];
  return (
    <WalletProvider wallets={wallets} autoConnect>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
