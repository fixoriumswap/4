import React, { useState } from 'react';
import { useFixoriumWallet } from '../context/FixoriumWallet';

interface DepositModalProps {
  onClose: () => void;
}

export default function DepositModal({ onClose }: DepositModalProps) {
  const { publicKey, user } = useFixoriumWallet();
  const [showQR, setShowQR] = useState(false);

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      alert('✅ Wallet address copied to clipboard!');
    }
  };

  const generateQRCode = () => {
    if (publicKey) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${publicKey.toString()}`;
    }
    return '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content deposit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📥 Deposit to Fixorium Wallet</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="deposit-content">
          <div className="deposit-info">
            <h3>Your Wallet Address</h3>
            <p>Send SOL or any Solana tokens to this address:</p>
          </div>

          <div className="address-section">
            <div className="wallet-address-display">
              <div className="address-text">
                {publicKey?.toString()}
              </div>
              <button className="copy-address-btn" onClick={copyAddress}>
                📋 Copy Address
              </button>
            </div>
          </div>

          <div className="qr-section">
            <button 
              className="qr-toggle-btn"
              onClick={() => setShowQR(!showQR)}
            >
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            
            {showQR && (
              <div className="qr-code-container">
                <img 
                  src={generateQRCode()} 
                  alt="Wallet QR Code"
                  className="qr-code"
                />
                <p className="qr-description">
                  Scan this QR code to send SOL or tokens
                </p>
              </div>
            )}
          </div>

          <div className="deposit-instructions">
            <h4>📝 Instructions:</h4>
            <ul>
              <li><strong>SOL:</strong> Send any amount of SOL to your wallet address</li>
              <li><strong>SPL Tokens:</strong> Send any Solana-based tokens (USDC, BONK, WIF, etc.)</li>
              <li><strong>Pump.fun Tokens:</strong> All pump.fun tokens are supported</li>
              <li><strong>Network:</strong> Only use Solana mainnet</li>
              <li><strong>Fees:</strong> Deposits are free, only network fees apply</li>
            </ul>
          </div>

          <div className="deposit-warning">
            <h4>⚠️ Important:</h4>
            <ul>
              <li>Only send Solana network tokens to this address</li>
              <li>Never send other network tokens (Ethereum, Bitcoin, etc.)</li>
              <li>Double-check the address before sending</li>
              <li>Deposits typically appear within 1-2 minutes</li>
            </ul>
          </div>

          <div className="user-info">
            <p><strong>Account:</strong> {user?.email}</p>
            <p><strong>Created:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
