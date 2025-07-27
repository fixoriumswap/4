import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

// Platform fee configuration
const PLATFORM_FEE_AMOUNT = 0.0005; // 0.0005 SOL
const PLATFORM_FEE_ADDRESS = 'FNVD1wied3e8WMuWs34KSamrCpughCMTjoXUE1ZXa6wM';

interface WalletUser {
  email: string;
  publicKey: string;
  encryptedPrivateKey: string;
  createdAt: string;
}

interface FixoriumWalletContextType {
  user: WalletUser | null;
  isAuthenticated: boolean;
  publicKey: PublicKey | null;
  balance: number;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  getKeypair: () => Keypair | null;
  refreshBalance: () => Promise<void>;
}

const FixoriumWalletContext = createContext<FixoriumWalletContextType | undefined>(undefined);

// Multiple RPC endpoints for fallback
const RPC_ENDPOINTS = [
  'https://solana-mainnet.g.alchemy.com/v2/alch-demo',
  'https://rpc.ankr.com/solana',
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://api.devnet.solana.com'
];

let currentRpcIndex = 0;
let connection = new Connection(RPC_ENDPOINTS[currentRpcIndex]);

// Function to get next working RPC connection
const getWorkingConnection = async (): Promise<Connection> => {
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const testConnection = new Connection(RPC_ENDPOINTS[currentRpcIndex]);
      // Test the connection with a simple getSlot call
      await testConnection.getSlot();
      connection = testConnection;
      return testConnection;
    } catch (error) {
      console.log(`RPC ${RPC_ENDPOINTS[currentRpcIndex]} failed, trying next...`);
      currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
    }
  }
  // If all fail, return the last connection and let it error
  return connection;
};

export function FixoriumWalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WalletUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on load
  useEffect(() => {
    const savedUser = localStorage.getItem('fixoriumUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setPublicKey(new PublicKey(userData.publicKey));
        setIsAuthenticated(true);
        refreshBalance();
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('fixoriumUser');
      }
    }
    setLoading(false);
  }, []);

  // Generate a deterministic keypair from email
  const generateKeypairFromEmail = (email: string): Keypair => {
    // Create a deterministic seed from email
    const seed = nacl.hash(new TextEncoder().encode(email + 'FIXORIUM_SALT_2024'));
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    return keypair;
  };

  // Encrypt private key with simple encryption (for demo - use proper encryption in production)
  const encryptPrivateKey = (privateKey: Uint8Array, password: string): string => {
    const encrypted = Buffer.from(privateKey).toString('base64');
    return encrypted; // In production, use proper encryption with the password
  };

  // Decrypt private key
  const decryptPrivateKey = (encryptedKey: string, password: string): Uint8Array => {
    return Buffer.from(encryptedKey, 'base64'); // In production, use proper decryption
  };

  // Simulate Google OAuth (replace with actual Google OAuth)
  const signInWithGoogle = async (): Promise<void> => {
    setLoading(true);
    
    try {
      // Simulate Google OAuth popup
      const email = await simulateGoogleAuth();
      
      if (!email) {
        throw new Error('Authentication cancelled');
      }

      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('fixoriumUsers') || '[]');
      let existingUser = existingUsers.find((u: WalletUser) => u.email === email);

      if (existingUser) {
        // User exists, load their wallet
        setUser(existingUser);
        setPublicKey(new PublicKey(existingUser.publicKey));
        setIsAuthenticated(true);
        localStorage.setItem('fixoriumUser', JSON.stringify(existingUser));
      } else {
        // New user, create wallet
        const keypair = generateKeypairFromEmail(email);
        const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey, email);
        
        const newUser: WalletUser = {
          email,
          publicKey: keypair.publicKey.toString(),
          encryptedPrivateKey,
          createdAt: new Date().toISOString()
        };

        // Save user to storage
        existingUsers.push(newUser);
        localStorage.setItem('fixoriumUsers', JSON.stringify(existingUsers));
        localStorage.setItem('fixoriumUser', JSON.stringify(newUser));

        setUser(newUser);
        setPublicKey(keypair.publicKey);
        setIsAuthenticated(true);

        console.log('New Fixorium wallet created for:', email);
        console.log('Wallet address:', keypair.publicKey.toString());
      }

      await refreshBalance();
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simulate Google OAuth popup
  const simulateGoogleAuth = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const email = prompt('Enter your Gmail address for Fixorium Wallet:');
      if (email && email.includes('@gmail.com')) {
        resolve(email.toLowerCase());
      } else if (email && !email.includes('@gmail.com')) {
        alert('Please use a Gmail address');
        resolve(null);
      } else {
        resolve(null);
      }
    });
  };

  const signOut = () => {
    setUser(null);
    setIsAuthenticated(false);
    setPublicKey(null);
    setBalance(0);
    localStorage.removeItem('fixoriumUser');
  };

  const getKeypair = (): Keypair | null => {
    if (!user) return null;
    
    try {
      const privateKeyBytes = decryptPrivateKey(user.encryptedPrivateKey, user.email);
      return Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
      console.error('Error getting keypair:', error);
      return null;
    }
  };

  const refreshBalance = async (): Promise<void> => {
    if (!publicKey) return;

    try {
      // Try current connection first
      const solBalance = await connection.getBalance(publicKey);
      setBalance(solBalance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.log('Primary RPC failed, trying fallback endpoints...');
      try {
        // Try to get a working connection
        const workingConnection = await getWorkingConnection();
        const solBalance = await workingConnection.getBalance(publicKey);
        setBalance(solBalance / LAMPORTS_PER_SOL);
        console.log(`Successfully connected using RPC: ${RPC_ENDPOINTS[currentRpcIndex]}`);
      } catch (fallbackError) {
        console.error('All RPC endpoints failed:', fallbackError);
        // Set balance to 0 on error to prevent app crash
        setBalance(0);
        // Optional: Show user notification about connectivity issues
        if (typeof window !== 'undefined') {
          console.warn('Network connectivity issues. Please try again later.');
        }
      }
    }
  };

  // Auto-refresh balance every 30 seconds (reduced to avoid rate limiting)
  useEffect(() => {
    if (isAuthenticated && publicKey) {
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, publicKey]);

  const value: FixoriumWalletContextType = {
    user,
    isAuthenticated,
    publicKey,
    balance,
    loading,
    signInWithGoogle,
    signOut,
    getKeypair,
    refreshBalance
  };

  return (
    <FixoriumWalletContext.Provider value={value}>
      {children}
    </FixoriumWalletContext.Provider>
  );
}

export function useFixoriumWallet() {
  const context = useContext(FixoriumWalletContext);
  if (context === undefined) {
    throw new Error('useFixoriumWallet must be used within a FixoriumWalletProvider');
  }
  return context;
}

export { PLATFORM_FEE_AMOUNT, PLATFORM_FEE_ADDRESS, getWorkingConnection, RPC_ENDPOINTS };
