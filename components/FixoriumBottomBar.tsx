import React, { useState } from 'react';
import { useFixoriumWallet } from '../context/FixoriumWallet';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import ExchangeModal from './ExchangeModal';
import SettingsModal from './SettingsModal';

export default function FixoriumBottomBar() {
  const { isAuthenticated, balance } = useFixoriumWallet();
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | 'exchange' | 'settings' | null>(null);

  if (!isAuthenticated) return null;

  return (
    <>
      <div className="fixorium-bottom-bar">
        <div className="bottom-bar-content">
          <button 
            className="bottom-bar-btn deposit-btn"
            onClick={() => setActiveModal('deposit')}
            title="Deposit SOL & Tokens"
          >
            <div className="btn-icon">📥</div>
            <span>Deposit</span>
          </button>

          <button 
            className="bottom-bar-btn withdraw-btn"
            onClick={() => setActiveModal('withdraw')}
            title="Withdraw SOL & Tokens"
          >
            <div className="btn-icon">📤</div>
            <span>Withdraw</span>
          </button>

          <button 
            className="bottom-bar-btn exchange-btn"
            onClick={() => setActiveModal('exchange')}
            title="Exchange Tokens"
          >
            <div className="btn-icon">🔄</div>
            <span>Exchange</span>
          </button>

          <button 
            className="bottom-bar-btn settings-btn"
            onClick={() => setActiveModal('settings')}
            title="Wallet Settings"
          >
            <div className="btn-icon">⚙️</div>
            <span>Settings</span>
          </button>
        </div>

        <div className="wallet-info-bar">
          <div className="balance-display">
            <span className="balance-label">Balance:</span>
            <span className="balance-amount">{balance.toFixed(4)} SOL</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'deposit' && (
        <DepositModal onClose={() => setActiveModal(null)} />
      )}
      
      {activeModal === 'withdraw' && (
        <WithdrawModal onClose={() => setActiveModal(null)} />
      )}
      
      {activeModal === 'exchange' && (
        <ExchangeModal onClose={() => setActiveModal(null)} />
      )}
      
      {activeModal === 'settings' && (
        <SettingsModal onClose={() => setActiveModal(null)} />
      )}
    </>
  );
}
