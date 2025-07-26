import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

function BalanceContent() {
  const { publicKey } = useWallet();
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTotalBalance() {
      if (!publicKey) {
        setTotalBalance(0);
        return;
      }

      setLoading(true);
      try {
        const connection = new Connection(RPC_URL);
        
        // Get SOL balance
        const solBalance = await connection.getBalance(publicKey);
        const solAmount = solBalance / Math.pow(10, 9);
        
        // For now, just show SOL balance as total
        // In production, you would convert all token values to USD and sum them
        setTotalBalance(solAmount);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setTotalBalance(0);
      } finally {
        setLoading(false);
      }
    }

    fetchTotalBalance();
  }, [publicKey]);

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
