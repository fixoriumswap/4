import React from 'react';
import { useWalletContext } from './WalletContext';

export default function WalletBar({ onDisconnect }: { onDisconnect: () => void }) {
  const { publicKey, signOutWallet } = useWalletContext();
  const address = publicKey?.toBase58();

  function shortAddr(addr: string) {
    return addr ? `${addr.slice(0,4)}...${addr.slice(-4)}` : '';
  }

  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address);
      alert('Copied!');
    }
  }

  if (!publicKey) return null;
  return (
    <div style={{display:"flex",alignItems:"center",marginTop:"10px"}}>
      <span className="wallet-address" title={address}>{shortAddr(address!)}</span>
      <button className="copy-btn" onClick={copyAddress}>Copy</button>
      <button className="wallet-btn" onClick={() => { signOutWallet(); onDisconnect(); }}>Disconnect</button>
    </div>
  );
      }
