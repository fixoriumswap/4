import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

export default function Header() {
  const { publicKey, connect, disconnect, connecting } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      if (publicKey) {
        try {
          const connection = new Connection(RPC_URL);
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / 1e9);
        } catch (e) {
          setBalance(null);
        }
      } else {
        setBalance(null);
      }
    }
    fetchBalance();
  }, [publicKey]);

  const shortAddress = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : '';

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div className="header">
      <div className="logo-title-wrap">
        <svg className="logo" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#29D6B6"/><text x="32" y="42" textAnchor="middle" fontSize="28" fill="#23272F" fontFamily="Arial" fontWeight="bold">F</text></svg>
        <span className="title">FIXORIUM</span>
      </div>
      <div className="wallet-controls">
        {!publicKey ? (
          <button
            className="connect-btn"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="wallet-info">
            <span className="wallet-address">{shortAddress}</span>
            <span className="wallet-balance">{balance !== null ? `${balance.toFixed(3)} SOL` : '...'}</span>
            <button className="disconnect-btn" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
