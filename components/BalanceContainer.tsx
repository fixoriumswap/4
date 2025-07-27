import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';

const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

function BalanceContent() {
  const { publicKey, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function fetchTotalBalance() {
      if (!publicKey || !connected) {
        setTotalBalance(0);
        setError(null);
        return;
      }

      try {
        console.log('Fetching wallet balance for:', publicKey.toString());
        setError(null);

        // Try primary connection first, then fallback endpoints
        let lastError: any = null;
        let balanceFetched = false;

        // Try the wallet adapter connection first
        try {
          const solBalance = await connection.getBalance(publicKey, 'confirmed');
          const solAmount = solBalance / Math.pow(10, 9);
          console.log('SOL Balance (wallet connection):', solAmount);
          setTotalBalance(solAmount);
          setRetryCount(0);
          balanceFetched = true;
        } catch (walletConnError) {
          console.log('Wallet connection failed, trying fallback:', walletConnError);
          lastError = walletConnError;
        }

        // If wallet connection failed, try fallback RPC endpoints
        if (!balanceFetched) {
          for (const rpcUrl of RPC_ENDPOINTS) {
            try {
              console.log(`Trying RPC endpoint: ${rpcUrl}`);
              const fallbackConnection = new Connection(rpcUrl, {
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 8000,
              });

              const solBalance = await fallbackConnection.getBalance(publicKey, 'confirmed');
              const solAmount = solBalance / Math.pow(10, 9);
              console.log(`SOL Balance (${rpcUrl}):`, solAmount);
              setTotalBalance(solAmount);
              setRetryCount(0);
              balanceFetched = true;
              break;
            } catch (rpcError) {
              console.log(`RPC endpoint ${rpcUrl} failed:`, rpcError);
              lastError = rpcError;
            }
          }
        }

        if (!balanceFetched) {
          throw lastError || new Error('All RPC endpoints failed');
        }

      } catch (error) {
        console.error('Error fetching balance:', error);
        setError(`Failed to fetch balance${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);
        setRetryCount(prev => prev + 1);
        // Don't reset balance to 0 on error, keep last known balance
      }
    }

    if (connected && publicKey) {
      setIsVisible(true);
      setLoading(true);
      console.log('Balance component: Wallet connected, fetching balance for:', publicKey.toString());

      fetchTotalBalance().finally(() => setLoading(false));

      // Set up balance monitoring with adaptive interval
      const interval = setInterval(fetchTotalBalance, error ? 10000 : 5000); // Slower refresh on errors

      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
      setTotalBalance(0);
      setError(null);
      setLoading(false);
      if (!connected) {
        console.log('Balance component: Wallet not connected');
      }
    }
  }, [publicKey, connected, connection, retryCount]);

  // Listen for wallet events for immediate updates
  useEffect(() => {
    if (wallet && wallet.adapter) {
      const handleAccountChange = () => {
        console.log('Wallet account changed, refreshing balance...');
        if (publicKey && connected) {
          // Immediate balance refresh on account change
          setLoading(true);
          setError(null);
          connection.getBalance(publicKey, 'confirmed').then(balance => {
            setTotalBalance(balance / Math.pow(10, 9));
            setRetryCount(0);
          }).catch(error => {
            console.error('Account change balance fetch error:', error);
            setError('Failed to refresh balance');
          }).finally(() => {
            setLoading(false);
          });
        }
      };

      // Listen for account changes
      if (wallet.adapter.on) {
        wallet.adapter.on('accountChanged', handleAccountChange);

        return () => {
          if (wallet.adapter.off) {
            wallet.adapter.off('accountChanged', handleAccountChange);
          }
        };
      }
    }
  }, [wallet, publicKey, connected, connection]);

  if (!publicKey) return null;

  return (
    <div className="balance-container">
      <div className="balance-header">
        <h3>Wallet Balance</h3>
      </div>
      <div className="balance-content">
        {loading ? (
          <div className="balance-loading">
            <span className="spinner" /> {error ? 'Retrying...' : 'Loading...'}
          </div>
        ) : error ? (
          <div className="balance-error">
            <div className="balance-amount">
              <span className="balance-value">{totalBalance.toFixed(4)}</span>
              <span className="balance-currency">SOL</span>
            </div>
            <div className="error-text">{error}</div>
          </div>
        ) : (
          <div className="balance-amount">
            <span className="balance-value">{totalBalance.toFixed(4)}</span>
            <span className="balance-currency">SOL</span>
            {retryCount === 0 && <span className="live-indicator">●</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BalanceContainer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <BalanceContent />;
}
