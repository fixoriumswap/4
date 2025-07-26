import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

function BalanceContent() {
  const { publicKey, connected } = useWallet();
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTotalBalance() {
      if (!publicKey || !connected) {
        setTotalBalance(0);
        return;
      }

      setLoading(true);
      try {
        const connection = new Connection(RPC_URL, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 30000,
        });

        console.log('Fetching balance for:', publicKey.toString());

        // Get SOL balance with retry logic
        let retries = 3;
        let solBalance = 0;

        while (retries > 0) {
          try {
            solBalance = await connection.getBalance(publicKey);
            break;
          } catch (retryError) {
            console.log(`Balance fetch attempt ${4 - retries} failed:`, retryError);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        const solAmount = solBalance / Math.pow(10, 9);
        console.log('SOL Balance:', solAmount);

        setTotalBalance(solAmount);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setTotalBalance(0);
      } finally {
        setLoading(false);
      }
    }

    fetchTotalBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchTotalBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connected]);

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
