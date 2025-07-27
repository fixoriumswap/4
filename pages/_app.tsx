import '../styles/globals.css'
import '@solana/wallet-adapter-react-ui/styles.css';
import type { AppProps } from 'next/app'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const network = WalletAdapterNetwork.Mainnet;
  // Use multiple high-quality RPC endpoints for better reliability
  const endpoint = useMemo(() => {
    // Try to use a high-performance RPC endpoint first, fallback to default
    const rpcEndpoints = [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      clusterApiUrl(network)
    ];
    return rpcEndpoints[0]; // Use the first one by default
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
