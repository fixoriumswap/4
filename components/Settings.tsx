import React, { useState, useEffect } from 'react';
import { useWalletContext } from './WalletContext';

interface WalletSettings {
  autoConnect: boolean;
  showBalances: boolean;
  defaultSlippage: number;
  notifications: boolean;
  darkMode: boolean;
  currency: 'USD' | 'EUR' | 'SOL';
  rpcEndpoint: string;
  explorerUrl: string;
}

const DEFAULT_SETTINGS: WalletSettings = {
  autoConnect: true,
  showBalances: true,
  defaultSlippage: 0.5,
  notifications: true,
  darkMode: true,
  currency: 'USD',
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  explorerUrl: 'https://solscan.io'
};

const RPC_ENDPOINTS = [
  { name: 'Solana Mainnet', url: 'https://api.mainnet-beta.solana.com' },
  { name: 'Solana Devnet', url: 'https://api.devnet.solana.com' },
  { name: 'Solana Testnet', url: 'https://api.testnet.solana.com' },
  { name: 'QuickNode', url: 'https://your-quicknode-endpoint.solana-mainnet.quiknode.pro' },
  { name: 'Alchemy', url: 'https://solana-mainnet.g.alchemy.com/v2/your-api-key' }
];

const EXPLORERS = [
  { name: 'Solscan', url: 'https://solscan.io' },
  { name: 'Solana Explorer', url: 'https://explorer.solana.com' },
  { name: 'SolanaFM', url: 'https://solana.fm' }
];

export default function Settings() {
  const { publicKey, signOutWallet, isConnected: connected } = useWalletContext();
  const [settings, setSettings] = useState<WalletSettings>(DEFAULT_SETTINGS);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [exportInProgress, setExportInProgress] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('wallet-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const updateSetting = (key: keyof WalletSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('wallet-settings', JSON.stringify(newSettings));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('wallet-settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  const exportTransactionHistory = async () => {
    setExportInProgress(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const exportData = {
        walletAddress: publicKey?.toString(),
        exportDate: new Date().toISOString(),
        settings: settings,
        note: 'Transaction history export from Solana Wallet'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportInProgress(false);
    }
  };

  const copyWalletInfo = () => {
    if (publicKey) {
      const info = `Wallet Address: ${publicKey.toString()}\nNetwork: Solana Mainnet\nExported: ${new Date().toLocaleString()}`;
      navigator.clipboard.writeText(info);
    }
  };

  return (
    <div className="settings">
      {/* Wallet Info */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Wallet Information</h2>
        </div>

        {connected && publicKey ? (
          <div className="wallet-info">
            <div className="info-row">
              <span className="info-label">Wallet Address</span>
              <div className="info-value">
                <span className="address">{publicKey.toString()}</span>
                <button className="btn btn-secondary btn-sm" onClick={copyWalletInfo}>
                  📋 Copy
                </button>
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">Network</span>
              <span className="info-value">Solana Mainnet</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="status-indicator status-success">Connected</span>
            </div>
            <div className="wallet-actions">
              <button className="btn btn-secondary" onClick={exportTransactionHistory} disabled={exportInProgress}>
                {exportInProgress ? (
                  <>
                    <span className="spinner" />
                    Exporting...
                  </>
                ) : (
                  <>📤 Export Data</>
                )}
              </button>
              <button className="btn btn-danger" onClick={() => disconnect()}>
                🔌 Disconnect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="wallet-not-connected">
            <div className="empty-icon">🔐</div>
            <div className="empty-title">No wallet connected</div>
            <div className="empty-description">
              Connect your wallet to access settings and manage your account.
            </div>
          </div>
        )}
      </div>

      {/* General Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">General Settings</h3>
        </div>

        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Auto Connect</div>
              <div className="setting-description">Automatically connect to your wallet when you open the app</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.autoConnect}
                onChange={(e) => updateSetting('autoConnect', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Show Balances</div>
              <div className="setting-description">Display token balances in the dashboard</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.showBalances}
                onChange={(e) => updateSetting('showBalances', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Notifications</div>
              <div className="setting-description">Receive notifications for transactions and updates</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSetting('notifications', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Currency</div>
              <div className="setting-description">Default currency for displaying values</div>
            </div>
            <select
              className="setting-select"
              value={settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="SOL">SOL</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Default Slippage</div>
              <div className="setting-description">Default slippage tolerance for swaps (%)</div>
            </div>
            <div className="slippage-controls">
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={settings.defaultSlippage}
                onChange={(e) => updateSetting('defaultSlippage', parseFloat(e.target.value))}
                className="slippage-slider"
              />
              <span className="slippage-value">{settings.defaultSlippage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Network Settings</h3>
        </div>

        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">RPC Endpoint</div>
              <div className="setting-description">Solana RPC endpoint for blockchain interactions</div>
            </div>
            <select
              className="setting-select"
              value={settings.rpcEndpoint}
              onChange={(e) => updateSetting('rpcEndpoint', e.target.value)}
            >
              {RPC_ENDPOINTS.map((endpoint) => (
                <option key={endpoint.url} value={endpoint.url}>
                  {endpoint.name}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Block Explorer</div>
              <div className="setting-description">Default explorer for viewing transactions</div>
            </div>
            <select
              className="setting-select"
              value={settings.explorerUrl}
              onChange={(e) => updateSetting('explorerUrl', e.target.value)}
            >
              {EXPLORERS.map((explorer) => (
                <option key={explorer.url} value={explorer.url}>
                  {explorer.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Security & Privacy */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Security & Privacy</h3>
        </div>

        <div className="security-section">
          <div className="security-item">
            <div className="security-icon">🔒</div>
            <div className="security-content">
              <div className="security-title">Private Key Security</div>
              <div className="security-description">
                Your private keys are never stored on our servers. They remain secure in your wallet extension.
              </div>
            </div>
          </div>

          <div className="security-item">
            <div className="security-icon">🛡️</div>
            <div className="security-content">
              <div className="security-title">Transaction Signing</div>
              <div className="security-description">
                All transactions require your explicit approval and signature from your connected wallet.
              </div>
            </div>
          </div>

          <div className="security-item">
            <div className="security-icon">🔐</div>
            <div className="security-content">
              <div className="security-title">Data Privacy</div>
              <div className="security-description">
                We don't collect personal data. All settings are stored locally in your browser.
              </div>
              <button
                className="privacy-toggle"
                onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
              >
                {showPrivacyInfo ? 'Hide' : 'Show'} Privacy Details
              </button>
            </div>
          </div>

          {showPrivacyInfo && (
            <div className="privacy-details">
              <h4>Privacy Information</h4>
              <ul>
                <li>Wallet addresses and transaction data are public on the Solana blockchain</li>
                <li>Application settings are stored locally in your browser</li>
                <li>No personal information is collected or transmitted to external servers</li>
                <li>RPC calls are made directly to Solana network nodes</li>
                <li>You can clear all local data by resetting settings or clearing browser storage</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Advanced */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Advanced</h3>
        </div>

        <div className="advanced-actions">
          <button className="btn btn-secondary" onClick={resetSettings}>
            🔄 Reset to Defaults
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>
            ♻️ Refresh Application
          </button>
        </div>
      </div>

      <style jsx>{`
        .settings {
          max-width: 700px;
          margin: 0 auto;
        }

        .wallet-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-weight: 600;
          color: #94a3b8;
          font-size: 14px;
        }

        .info-value {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: #e2e8f0;
        }

        .address {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 12px;
          color: #60a5fa;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wallet-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .wallet-not-connected {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-title {
          font-size: 18px;
          font-weight: bold;
          color: #e2e8f0;
          margin-bottom: 8px;
        }

        .empty-description {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.5;
        }

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-info {
          flex: 1;
          margin-right: 20px;
        }

        .setting-name {
          font-size: 16px;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 4px;
        }

        .setting-description {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.4;
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.2);
          transition: 0.2s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.2s;
          border-radius: 50%;
        }

        .toggle input:checked + .toggle-slider {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        }

        .toggle input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .setting-select {
          padding: 8px 12px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 14px;
          min-width: 140px;
        }

        .setting-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .slippage-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .slippage-slider {
          width: 120px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
          appearance: none;
        }

        .slippage-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .slippage-value {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
          min-width: 40px;
        }

        .security-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .security-item {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: rgba(15, 23, 42, 0.4);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .security-icon {
          font-size: 24px;
          margin-top: 4px;
        }

        .security-content {
          flex: 1;
        }

        .security-title {
          font-size: 16px;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 8px;
        }

        .security-description {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .privacy-toggle {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .privacy-toggle:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        .privacy-details {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 12px;
          padding: 20px;
          margin-top: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .privacy-details h4 {
          margin: 0 0 16px 0;
          color: #e2e8f0;
          font-size: 16px;
        }

        .privacy-details ul {
          margin: 0;
          padding-left: 20px;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
        }

        .privacy-details li {
          margin-bottom: 8px;
        }

        .advanced-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .setting-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .setting-info {
            margin-right: 0;
          }

          .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .wallet-actions {
            flex-direction: column;
          }

          .wallet-actions .btn {
            width: 100%;
          }

          .address {
            max-width: none;
            word-break: break-all;
          }

          .slippage-controls {
            width: 100%;
          }

          .slippage-slider {
            flex: 1;
          }

          .advanced-actions {
            flex-direction: column;
          }

          .advanced-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
