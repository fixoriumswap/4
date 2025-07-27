import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import { MobileWalletService } from '../utils/mobileWalletService';
import { useRouter } from 'next/router';

interface MobileUser {
  phoneNumber: string;
  walletSeed: string;
}

interface WalletContextType {
  // Mobile Auth
  user: MobileUser | null;
  isLoading: boolean;
  
  // Wallet Info
  publicKey: PublicKey | null;
  keypair: Keypair | null;
  balance: number;
  isWalletLoading: boolean;
  
  // Methods
  signInWithMobile: () => void;
  signOutWallet: () => void;
  refreshBalance: () => Promise<void>;
  checkSession: () => Promise<void>;
  
  // Connection status
  isConnected: boolean;
  connectionType: 'mobile' | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<MobileUser | null>(null);
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionType, setConnectionType] = useState<'mobile' | null>(null);

  const isConnected = !!user && !!publicKey;

  // Check session on mount and when needed
  const checkSession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (response.ok && data.isValid) {
        setUser({
          phoneNumber: data.user.phoneNumber,
          walletSeed: data.user.walletSeed
        });
      } else {
        // Invalid session, clear state
        setUser(null);
        setKeypair(null);
        setPublicKey(null);
        setBalance(0);
        setConnectionType(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      // Network error or no session
      setUser(null);
      setKeypair(null);
      setPublicKey(null);
      setBalance(0);
      setConnectionType(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Generate wallet from mobile session
  useEffect(() => {
    if (user?.phoneNumber && user?.walletSeed) {
      try {
        setIsWalletLoading(true);
        
        const walletInfo = MobileWalletService.generateWalletFromMobile(
          user.phoneNumber,
          user.walletSeed
        );
        
        const keyPair = Keypair.fromSecretKey(walletInfo.privateKey);
        const pubKey = keyPair.publicKey;
        
        setKeypair(keyPair);
        setPublicKey(pubKey);
        setConnectionType('mobile');
        
        // Refresh balance after wallet is set
        refreshBalance();
        
      } catch (error) {
        console.error('Error generating wallet from mobile:', error);
      } finally {
        setIsWalletLoading(false);
      }
    } else {
      setKeypair(null);
      setPublicKey(null);
      setBalance(0);
      setConnectionType(null);
    }
  }, [user]);

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

  const signInWithMobile = () => {
    router.push('/auth/signin');
  };

  const signOutWallet = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local state
    setUser(null);
    setKeypair(null);
    setPublicKey(null);
    setBalance(0);
    setConnectionType(null);
    
    // Redirect to signin
    router.push('/auth/signin');
  };

  const value: WalletContextType = {
    user,
    isLoading,
    publicKey,
    keypair,
    balance,
    isWalletLoading,
    signInWithMobile,
    signOutWallet,
    refreshBalance,
    checkSession,
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
