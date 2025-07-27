import '../styles/globals.css'
import '@solana/wallet-adapter-react-ui/styles.css';
import type { AppProps } from 'next/app'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  SolletWalletAdapter,
  MathWalletAdapter,
  Coin98WalletAdapter,
  CloverWalletAdapter,
  SlopeWalletAdapter,
  SafePalWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  // Use mainnet-beta for production
  const network = WalletAdapterNetwork.Mainnet;
  
  // Enhanced RPC endpoint with fallback
  const endpoint = useMemo(() => {
    // Try to use environment variable first, fallback to public RPC
    return process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(network);
  }, [network]);

  // Comprehensive wallet list for maximum compatibility
  const wallets = useMemo(
    () => [
      // Most popular wallets first
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      
      // Additional wallet support
      new MathWalletAdapter(),
      new Coin98WalletAdapter(),
      new CloverWalletAdapter(),
      new SlopeWalletAdapter(),
      new SafePalWalletAdapter(),
    ],
    [network]
  );

  return (
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
        autoConnect={false}
        onError={(error) => {
          console.error('Wallet error:', error);
          // In production, you might want to send this to an error reporting service
        }}
      >
        <WalletModalProvider
          featuredWallets={4} // Show top 4 wallets prominently
        >
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
