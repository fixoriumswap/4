import React, { useEffect, useState } from 'react';
import { useWalletContext } from './WalletContext';
import { Connection } from '@solana/web3.js';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

function BalanceContent() {
  const { publicKey, isConnected: connected, connectionType } = useWalletContext();
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTotalBalance() {
      if (!publicKey || !connected) {
        setTotalBalance(0);
        return;
      }

      try {
        const connection = new Connection(RPC_URL, {
          commitment: 'finalized',
          confirmTransactionInitialTimeout: 10000,
        });

        console.log('Fetching real-time balance for:', publicKey.toString());

        // Get SOL balance
        const solBalance = await connection.getBalance(publicKey, 'finalized');
        const solAmount = solBalance / Math.pow(10, 9);
        console.log('Current SOL Balance:', solAmount);

        setTotalBalance(solAmount);
      } catch (error) {
        console.error('Error fetching balance:', error);
        // Don't reset to 0 on error, keep last known balance
      }
    }

    if (connected && publicKey) {
      setLoading(true);
      fetchTotalBalance().finally(() => setLoading(false));

      // Set up real-time balance monitoring
      const interval = setInterval(fetchTotalBalance, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    } else {
      setTotalBalance(0);
      setLoading(false);
    }
  }, [publicKey, connected]);

  // Listen for wallet events for immediate updates
  useEffect(() => {
    if (wallet && wallet.adapter) {
      const handleAccountChange = () => {
        console.log('Wallet account changed, refreshing balance...');
        if (publicKey && connected) {
          // Immediate balance refresh on account change
          const connection = new Connection(RPC_URL);
          connection.getBalance(publicKey).then(balance => {
            setTotalBalance(balance / Math.pow(10, 9));
          }).catch(console.error);
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
  }, [wallet, publicKey, connected]);

  if (!publicKey) return null;

  return (
    <div className="balance-container">
      <div className="balance-header">
        <h3>Wallet Balance</h3>
      </div>
      <div className="balance-content">
        {loading ? (
          <div className="balance-loading">
            <span className="spinner" /> Loading...
          </div>
        ) : (
          <div className="balance-amount">
            <span className="balance-value">{totalBalance.toFixed(4)}</span>
            <span className="balance-currency">SOL</span>
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
