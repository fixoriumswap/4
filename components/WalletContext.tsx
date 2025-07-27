import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import { GmailWalletService } from '../utils/walletService';

interface WalletContextType {
  // Gmail Auth
  session: any;
  isLoading: boolean;
  
  // Wallet Info
  publicKey: PublicKey | null;
  keypair: Keypair | null;
  balance: number;
  isWalletLoading: boolean;
  
  // Methods
  signInWithGmail: () => void;
  signOutWallet: () => void;
  refreshBalance: () => Promise<void>;
  
  // Connection status
  isConnected: boolean;
  connectionType: 'gmail' | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { data: session, status } = useSession();
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [connectionType, setConnectionType] = useState<'gmail' | 'extension' | null>(null);

  const isLoading = status === 'loading';
  const isConnected = !!session && !!publicKey;

  // Generate wallet from Gmail session
  useEffect(() => {
    if (session?.user?.id && session.walletSeed) {
      try {
        setIsWalletLoading(true);
        
        const walletInfo = GmailWalletService.generateWalletFromGmail(
          session.user.id,
          session.walletSeed
        );
        
        const keyPair = Keypair.fromSecretKey(walletInfo.privateKey);
        const pubKey = keyPair.publicKey;
        
        setKeypair(keyPair);
        setPublicKey(pubKey);
        setConnectionType('gmail');
        
        // Refresh balance after wallet is set
        refreshBalance();
        
      } catch (error) {
        console.error('Error generating wallet from Gmail:', error);
      } finally {
        setIsWalletLoading(false);
      }
    } else {
      setKeypair(null);
      setPublicKey(null);
      setBalance(0);
      setConnectionType(null);
    }
  }, [session]);

  const refreshBalance = async () => {
    if (!publicKey) return;
    
    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / 1e9); // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const signInWithGmail = () => {
    signIn('google', { callbackUrl: '/' });
  };

  const signOutWallet = () => {
    signOut({ callbackUrl: '/auth/signin' });
    setKeypair(null);
    setPublicKey(null);
    setBalance(0);
    setConnectionType(null);
  };

  const value: WalletContextType = {
    session,
    isLoading,
    publicKey,
    keypair,
    balance,
    isWalletLoading,
    signInWithGmail,
    signOutWallet,
    refreshBalance,
    isConnected,
    connectionType,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}

export default WalletContext;
