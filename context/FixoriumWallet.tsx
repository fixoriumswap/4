import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

// Platform fee configuration
const PLATFORM_FEE_AMOUNT = 0.0005; // 0.0005 SOL
const PLATFORM_FEE_ADDRESS = 'FNVD1wied3e8WMuWs34KSamrCpughCMTjoXUE1ZXa6wM';

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

interface UserAccount {
  email: string;
  passwordHash: string;
  country: string;
  mobileNumber: string;
  publicKey: string;
  encryptedPrivateKey: string;
  createdAt: string;
  verified: boolean;
}

interface FixoriumWalletContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  publicKey: PublicKey | null;
  balance: number;
  loading: boolean;
  signUp: (email: string, password: string, country: string, mobileNumber: string) => Promise<{ success: boolean; verificationCode?: string; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; requiresVerification?: boolean; error?: string }>;
  verifyMobileCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  recoverPassword: (mobileNumber: string) => Promise<{ success: boolean; verificationCode?: string; error?: string }>;
  resetPassword: (verificationCode: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  getKeypair: () => Keypair | null;
  refreshBalance: () => Promise<void>;
}

const FixoriumWalletContext = createContext<FixoriumWalletContextType | undefined>(undefined);

// Simple hash function (in production, use bcrypt or similar)
const hashPassword = (password: string): string => {
  return btoa(password + 'FIXORIUM_SALT_2024');
};

// Verify password
const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

// Generate verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export function FixoriumWalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState<{
    user: UserAccount;
    verificationCode: string;
    type: 'signup' | 'signin' | 'recovery';
    tempPassword?: string;
  } | null>(null);

  // Check if user is already authenticated on load
  useEffect(() => {
    const savedUser = localStorage.getItem('fixoriumUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.verified) {
          setUser(userData);
          setPublicKey(new PublicKey(userData.publicKey));
          setIsAuthenticated(true);
          refreshBalance();
        }
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('fixoriumUser');
      }
    }
    setLoading(false);
  }, []);

  // Generate a deterministic keypair from email
  const generateKeypairFromEmail = (email: string): Keypair => {
    const seed = nacl.hash(new TextEncoder().encode(email + 'FIXORIUM_SALT_2024'));
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    return keypair;
  };

  // Encrypt private key
  const encryptPrivateKey = (privateKey: Uint8Array, password: string): string => {
    const encrypted = Buffer.from(privateKey).toString('base64');
    return encrypted; // In production, use proper encryption with the password
  };

  // Decrypt private key
  const decryptPrivateKey = (encryptedKey: string, password: string): Uint8Array => {
    return Buffer.from(encryptedKey, 'base64'); // In production, use proper decryption
  };

  const signUp = async (email: string, password: string, country: string, mobileNumber: string): Promise<{ success: boolean; verificationCode?: string; error?: string }> => {
    setLoading(true);
    
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('fixoriumUsers') || '[]');
      const existingUser = existingUsers.find((u: UserAccount) => u.email === email || u.mobileNumber === mobileNumber);

      if (existingUser) {
        setLoading(false);
        return { success: false, error: 'User with this email or mobile number already exists' };
      }

      // Generate wallet
      const keypair = generateKeypairFromEmail(email);
      const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey, password);
      
      const newUser: UserAccount = {
        email,
        passwordHash: hashPassword(password),
        country,
        mobileNumber,
        publicKey: keypair.publicKey.toString(),
        encryptedPrivateKey,
        createdAt: new Date().toISOString(),
        verified: false
      };

      // Generate verification code
      const verificationCode = generateVerificationCode();
      
      // Store pending verification
      setPendingVerification({
        user: newUser,
        verificationCode,
        type: 'signup'
      });

      setLoading(false);
      
      // Simulate sending SMS (in production, integrate with SMS service)
      console.log(`SMS sent to ${mobileNumber}: Your Fixorium verification code is ${verificationCode}`);
      
      return { success: true, verificationCode }; // In production, don't return the code
    } catch (error: any) {
      setLoading(false);
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; requiresVerification?: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const existingUsers = JSON.parse(localStorage.getItem('fixoriumUsers') || '[]');
      const existingUser = existingUsers.find((u: UserAccount) => u.email === email);

      if (!existingUser) {
        setLoading(false);
        return { success: false, error: 'User not found' };
      }

      if (!verifyPassword(password, existingUser.passwordHash)) {
        setLoading(false);
        return { success: false, error: 'Invalid password' };
      }

      // Generate verification code for signin
      const verificationCode = generateVerificationCode();
      
      setPendingVerification({
        user: existingUser,
        verificationCode,
        type: 'signin'
      });

      setLoading(false);
      
      // Simulate sending SMS
      console.log(`SMS sent to ${existingUser.mobileNumber}: Your Fixorium login code is ${verificationCode}`);
      
      return { success: true, requiresVerification: true };
    } catch (error: any) {
      setLoading(false);
      return { success: false, error: error.message || 'Signin failed' };
    }
  };

  const verifyMobileCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingVerification) {
      return { success: false, error: 'No verification pending' };
    }

    if (code !== pendingVerification.verificationCode) {
      return { success: false, error: 'Invalid verification code' };
    }

    try {
      const { user, type, tempPassword } = pendingVerification;
      
      if (type === 'signup') {
        // Complete signup
        user.verified = true;
        const existingUsers = JSON.parse(localStorage.getItem('fixoriumUsers') || '[]');
        existingUsers.push(user);
        localStorage.setItem('fixoriumUsers', JSON.stringify(existingUsers));
      } else if (type === 'recovery' && tempPassword) {
        // Complete password recovery
        user.passwordHash = hashPassword(tempPassword);
        const existingUsers = JSON.parse(localStorage.getItem('fixoriumUsers') || '[]');
        const userIndex = existingUsers.findIndex((u: UserAccount) => u.email === user.email);
        if (userIndex !== -1) {
          existingUsers[userIndex] = user;
          localStorage.setItem('fixoriumUsers', JSON.stringify(existingUsers));
        }
      }

      // Set user as authenticated
      setUser(user);
      setPublicKey(new PublicKey(user.publicKey));
      setIsAuthenticated(true);
      localStorage.setItem('fixoriumUser', JSON.stringify(user));
      
      // Clear pending verification
      setPendingVerification(null);
      
      await refreshBalance();
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Verification failed' };
    }
  };

  const recoverPassword = async (mobileNumber: string): Promise<{ success: boolean; verificationCode?: string; error?: string }> => {
    try {
      const existingUsers = JSON.parse(localStorage.getItem('fixoriumUsers') || '[]');
      const existingUser = existingUsers.find((u: UserAccount) => u.mobileNumber === mobileNumber);

      if (!existingUser) {
        return { success: false, error: 'No account found with this mobile number' };
      }

      const verificationCode = generateVerificationCode();
      
      setPendingVerification({
        user: existingUser,
        verificationCode,
        type: 'recovery'
      });

      // Simulate sending SMS
      console.log(`SMS sent to ${mobileNumber}: Your Fixorium recovery code is ${verificationCode}`);
      
      return { success: true, verificationCode }; // In production, don't return the code
    } catch (error: any) {
      return { success: false, error: error.message || 'Recovery failed' };
    }
  };

  const resetPassword = async (verificationCode: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingVerification || pendingVerification.type !== 'recovery') {
      return { success: false, error: 'No password recovery pending' };
    }

    if (verificationCode !== pendingVerification.verificationCode) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Store the new password temporarily until verification
    setPendingVerification({
      ...pendingVerification,
      tempPassword: newPassword
    });

    return { success: true };
  };

  const signOut = () => {
    setUser(null);
    setIsAuthenticated(false);
    setPublicKey(null);
    setBalance(0);
    setPendingVerification(null);
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
    signUp,
    signIn,
    verifyMobileCode,
    recoverPassword,
    resetPassword,
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
