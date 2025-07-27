import '../styles/globals.css'
import '@solana/wallet-adapter-react-ui/styles.css';
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import { WalletProvider as CustomWalletProvider } from '../components/WalletContext';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Use mainnet-beta for production
  const network = WalletAdapterNetwork.Mainnet;
  
  // Enhanced RPC endpoint with fallback
  const endpoint = useMemo(() => {
    // Try to use environment variable first, fallback to public RPC
    return process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(network);
  }, [network]);

  // Wallet list with only verified working adapters
  const wallets = useMemo(
    () => [
      // Core wallets that are stable and working
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [network]
  );

  return (
    <SessionProvider session={session}>
      <ConnectionProvider 
        endpoint={endpoint}
        config={{
          commitment: 'confirmed',
          wsEndpoint: endpoint.replace('https://', 'wss://').replace('http://', 'ws://'),
          confirmTransactionInitialTimeout: 60000,
        }}
      >
        <WalletProvider 
          wallets={wallets} 
          autoConnect={true}
          onError={(error) => {
            console.error('Wallet error:', error);
          }}
        >
          <WalletModalProvider
            featuredWallets={4} // Show top 4 wallets prominently
          >
            <CustomWalletProvider>
              <Component {...pageProps} />
            </CustomWalletProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
}
