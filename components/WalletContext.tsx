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

  // Flag to prevent concurrent session checks
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  const isConnected = !!user && !!publicKey;

  const clearWalletState = () => {
    setUser(null);
    setKeypair(null);
    setPublicKey(null);
    setBalance(0);
    setConnectionType(null);
  };

  // Check session on mount and when needed
  const checkSession = async () => {
    // Prevent concurrent session checks
    if (isCheckingSession) {
      return;
    }

    try {
      setIsCheckingSession(true);
      setIsLoading(true);

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache'
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        clearWalletState();
        return;
      }

      // Clone response to avoid "body stream already read" error
      const responseClone = response.clone();
      let data;

      try {
        data = await responseClone.json();
      } catch (jsonError) {
        console.warn('Failed to parse session response as JSON:', jsonError);
        clearWalletState();
        return;
      }

      if (data && data.isValid && data.user) {
        setUser({
          phoneNumber: data.user.phoneNumber,
          walletSeed: data.user.walletSeed
        });
      } else {
        clearWalletState();
      }
    } catch (error) {
      console.error('Session check error:', error);
      clearWalletState();
    } finally {
      setIsLoading(false);
      setIsCheckingSession(false);
    }
  };

  // Check session on mount
  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      if (isMounted && !isCheckingSession) {
        await checkSession();
      }
    };

    initializeSession();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run on mount

  // Generate wallet from mobile session
  useEffect(() => {
    if (user?.phoneNumber && user?.walletSeed) {
      let isMounted = true;

      const generateWallet = async () => {
        try {
          if (!isMounted) return;

          setIsWalletLoading(true);

          // Validate user data
          if (!MobileWalletService.validatePhoneNumber(user.phoneNumber) ||
              !MobileWalletService.validateWalletSeed(user.walletSeed)) {
            throw new Error('Invalid user data for wallet generation');
          }

          const walletInfo = MobileWalletService.generateWalletFromMobile(
            user.phoneNumber,
            user.walletSeed
          );

          if (!isMounted) return;

          const keyPair = Keypair.fromSecretKey(walletInfo.privateKey);
          const pubKey = keyPair.publicKey;

          setKeypair(keyPair);
          setPublicKey(pubKey);
          setConnectionType('mobile');

          // Refresh balance after wallet is set
          if (isMounted) {
            refreshBalance();
          }

        } catch (error) {
          console.error('Error generating wallet from mobile:', error);
          if (isMounted) {
            // Clear wallet state on error
            setKeypair(null);
            setPublicKey(null);
            setConnectionType(null);
          }
        } finally {
          if (isMounted) {
            setIsWalletLoading(false);
          }
        }
      };

      generateWallet();

      return () => {
        isMounted = false;
      };
    } else {
      setKeypair(null);
      setPublicKey(null);
      setBalance(0);
      setConnectionType(null);
      setIsWalletLoading(false);
    }
  }, [user]);

  const refreshBalance = async () => {
    if (!publicKey) return;

    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const balance = await connection.getBalance(publicKey, 'confirmed');
      setBalance(balance / 1e9); // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching balance:', error);
      // Don't clear balance on error, just log it
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
