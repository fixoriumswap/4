import React, { useState, useEffect } from 'react';
import { useWalletContext } from './WalletContext';

export interface TransactionDetails {
  type: 'transfer' | 'swap' | 'stake' | 'unstake';
  amount?: number;
  token?: string;
  recipient?: string;
  fromToken?: string;
  toToken?: string;
  slippage?: number;
  fee?: number;
  validator?: string;
}

interface TransactionConfirmationProps {
  isOpen: boolean;
  transaction: TransactionDetails | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function TransactionConfirmation({
  isOpen,
  transaction,
  onConfirm,
  onCancel,
  loading = false
}: TransactionConfirmationProps) {
  const { publicKey } = useWalletContext();
  const [securityCheck, setSecurityCheck] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (isOpen) {
      setSecurityCheck(false);
      setCountdown(10);
      
      // Security countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'transfer': return '💸';
      case 'swap': return '🔄';
      case 'stake': return '🥞';
      case 'unstake': return '🔓';
      default: return '📝';
    }
  };

  const getTransactionTitle = () => {
    switch (transaction.type) {
      case 'transfer': return 'Confirm Transfer';
      case 'swap': return 'Confirm Token Swap';
      case 'stake': return 'Confirm SOL Staking';
      case 'unstake': return 'Confirm Unstaking';
      default: return 'Confirm Transaction';
    }
  };

  const renderTransactionDetails = () => {
    switch (transaction.type) {
      case 'transfer':
        return (
          <>
            <div className="detail-row">
              <span className="detail-label">Amount</span>
              <span className="detail-value">{transaction.amount} {transaction.token}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">To</span>
              <span className="detail-value address">{formatAddress(transaction.recipient!)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">From</span>
              <span className="detail-value address">{formatAddress(publicKey!.toString())}</span>
            </div>
          </>
        );

      case 'swap':
        return (
          <>
            <div className="detail-row">
              <span className="detail-label">From</span>
              <span className="detail-value">{transaction.amount} {transaction.fromToken}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">To (Est.)</span>
              <span className="detail-value">~{transaction.amount} {transaction.toToken}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Slippage</span>
              <span className="detail-value">{transaction.slippage}%</span>
            </div>
          </>
        );

      case 'stake':
        return (
          <>
            <div className="detail-row">
              <span className="detail-label">Stake Amount</span>
              <span className="detail-value">{transaction.amount} SOL</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Validator</span>
              <span className="detail-value">{transaction.validator || 'Unknown'}</span>
            </div>
          </>
        );

      case 'unstake':
        return (
          <>
            <div className="detail-row">
              <span className="detail-label">Unstake Amount</span>
              <span className="detail-value">{transaction.amount} SOL</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Validator</span>
              <span className="detail-value">{transaction.validator || 'Unknown'}</span>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="transaction-confirmation-overlay">
      <div className="transaction-confirmation-modal">
        <div className="modal-header">
          <div className="transaction-icon">{getTransactionIcon()}</div>
          <h2 className="modal-title">{getTransactionTitle()}</h2>
          <button className="close-button" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-content">
          {/* Security Warning */}
          <div className="security-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>Security Check</strong>
              <p>Please verify all transaction details before confirming. This action cannot be undone.</p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="transaction-details">
            <h3>Transaction Details</h3>
            <div className="details-grid">
              {renderTransactionDetails()}
              <div className="detail-row">
                <span className="detail-label">Network Fee</span>
                <span className="detail-value">{transaction.fee || '~0.001'} SOL</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Network</span>
                <span className="detail-value">Solana Mainnet</span>
              </div>
            </div>
          </div>

          {/* Security Checklist */}
          <div className="security-checklist">
            <h3>Security Verification</h3>
            <div className="checklist-item">
              <input
                type="checkbox"
                id="security-check"
                checked={securityCheck}
                onChange={(e) => setSecurityCheck(e.target.checked)}
              />
              <label htmlFor="security-check">
                I have verified all transaction details and understand this action is irreversible
              </label>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="risk-assessment">
            <div className="risk-item low">
              <div className="risk-icon">🟢</div>
              <div className="risk-text">
                <strong>Low Risk Transaction</strong>
                <p>Standard transaction with known addresses and tokens</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={onConfirm}
              disabled={!securityCheck || countdown > 0 || loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Processing...
                </>
              ) : countdown > 0 ? (
                `Confirm (${countdown}s)`
              ) : (
                'Confirm Transaction'
              )}
            </button>
          </div>

          {/* Additional Security Info */}
          <div className="security-info">
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <span className="info-text">Your private keys never leave your wallet</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🛡️</span>
              <span className="info-text">Transaction will be signed by your wallet</span>
            </div>
            <div className="info-item">
              <span className="info-icon">📋</span>
              <span className="info-text">View on explorer after confirmation</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .transaction-confirmation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .transaction-confirmation-modal {
          background: linear-gradient(145deg, #1e2334 0%, #252a41 100%);
          border-radius: 24px;
          width: 90vw;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px 24px 0 24px;
          position: relative;
        }

        .transaction-icon {
          font-size: 32px;
          width: 56px;
          height: 56px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(59, 130, 246, 0.3);
        }

        .modal-title {
          flex: 1;
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #fff;
        }

        .close-button {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .modal-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .security-warning {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 16px;
        }

        .warning-icon {
          font-size: 24px;
          margin-top: 2px;
        }

        .warning-text strong {
          display: block;
          color: #f59e0b;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .warning-text p {
          margin: 0;
          color: #fbbf24;
          font-size: 14px;
          line-height: 1.5;
        }

        .transaction-details {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .transaction-details h3 {
          margin: 0 0 16px 0;
          color: #e2e8f0;
          font-size: 18px;
        }

        .details-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }

        .detail-value {
          font-size: 14px;
          color: #e2e8f0;
          font-weight: 600;
          text-align: right;
        }

        .detail-value.address {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          color: #60a5fa;
          font-size: 12px;
        }

        .security-checklist {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .security-checklist h3 {
          margin: 0 0 16px 0;
          color: #e2e8f0;
          font-size: 18px;
        }

        .checklist-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .checklist-item input[type="checkbox"] {
          margin-top: 2px;
          width: 18px;
          height: 18px;
          accent-color: #3b82f6;
        }

        .checklist-item label {
          font-size: 14px;
          color: #e2e8f0;
          line-height: 1.5;
          cursor: pointer;
        }

        .risk-assessment {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .risk-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .risk-icon {
          font-size: 20px;
          margin-top: 2px;
        }

        .risk-text strong {
          display: block;
          color: #22c55e;
          font-size: 16px;
          margin-bottom: 4px;
        }

        .risk-text p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }

        .modal-actions .btn {
          flex: 1;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 600;
        }

        .security-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #94a3b8;
        }

        .info-icon {
          font-size: 14px;
        }

        .info-text {
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .transaction-confirmation-modal {
            width: 95vw;
            margin: 20px;
          }

          .modal-header {
            padding: 20px 20px 0 20px;
          }

          .modal-content {
            padding: 20px;
          }

          .modal-title {
            font-size: 20px;
          }

          .transaction-icon {
            width: 48px;
            height: 48px;
            font-size: 24px;
          }

          .modal-actions {
            flex-direction: column;
          }

          .security-warning,
          .transaction-details,
          .security-checklist,
          .risk-assessment {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
