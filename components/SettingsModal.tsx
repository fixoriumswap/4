import React, { useState } from 'react';
import { useFixoriumWallet } from '../context/FixoriumWallet';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user, balance, publicKey, signOut } = useFixoriumWallet();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  const copyPublicKey = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      alert('✅ Public key copied to clipboard!');
    }
  };

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out? Make sure you have backed up your wallet.')) {
      signOut();
      onClose();
    }
  };

  const showBackupInfo = () => {
    alert('⚠️ Important: Your wallet is deterministically generated from your Gmail account. As long as you remember your Gmail account, you can always recover your wallet by signing in again.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Wallet Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Account Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Created:</span>
                <span className="info-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Balance:</span>
                <span className="info-value">{balance.toFixed(6)} SOL</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Wallet Information</h3>
            <div className="wallet-info">
              <div className="public-key-section">
                <label>Public Key (Wallet Address):</label>
                <div className="key-display">
                  <span className="key-text">{publicKey?.toString()}</span>
                  <button className="copy-key-btn" onClick={copyPublicKey}>
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Security & Backup</h3>
            <div className="security-info">
              <div className="backup-notice">
                <h4>🔐 Wallet Security</h4>
                <p>Your Fixorium wallet is deterministically generated from your Gmail account. This means:</p>
                <ul>
                  <li>✅ Your wallet can always be recovered using your Gmail account</li>
                  <li>✅ No need to save seed phrases or private keys</li>
                  <li>✅ One Gmail account = One permanent wallet address</li>
                  <li>⚠️ Keep your Gmail account secure with 2FA enabled</li>
                </ul>
              </div>

              <button className="backup-btn" onClick={showBackupInfo}>
                📋 Backup Information
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3>Platform Information</h3>
            <div className="platform-info">
              <div className="info-item">
                <span className="info-label">Platform Fee:</span>
                <span className="info-value">0.0005 SOL per transaction</span>
              </div>
              <div className="info-item">
                <span className="info-label">Supported Networks:</span>
                <span className="info-value">Solana Mainnet</span>
              </div>
              <div className="info-item">
                <span className="info-label">Supported Tokens:</span>
                <span className="info-value">All Solana & Pump.fun tokens</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Account Recovery</h3>
            <div className="recovery-info">
              <h4>🔐 Wallet Recovery Instructions</h4>
              <p>Your Fixorium wallet can be recovered at any time using your Gmail account:</p>
              <ol>
                <li>Visit Fixorium Wallet website</li>
                <li>Click "Sign in with Gmail"</li>
                <li>Use the same Gmail account you used to create this wallet</li>
                <li>Your wallet will be automatically recovered with the same address</li>
              </ol>
              <div className="recovery-warning">
                <p><strong>⚠️ Important:</strong> Keep your Gmail account secure with 2FA enabled. Anyone with access to your Gmail can access your wallet.</p>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Account Actions</h3>
            <div className="action-buttons">
              <button className="settings-action-btn refresh-btn" onClick={() => window.location.reload()}>
                🔄 Refresh App
              </button>
              <button className="settings-action-btn recovery-btn" onClick={showBackupInfo}>
                🔑 Recovery Info
              </button>
              <button className="settings-action-btn danger-btn" onClick={handleSignOut}>
                🚪 Logout
              </button>
            </div>
          </div>

          <div className="settings-footer">
            <p className="version-info">Fixorium Wallet v1.0.0 - Solana & Pump.fun Platform</p>
            <p className="security-note">
              🔒 Your private keys never leave this device and are encrypted with your Gmail account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
