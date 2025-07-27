import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

interface Transaction {
  signature: string;
  blockTime: number;
  slot: number;
  type: 'transfer' | 'swap' | 'stake' | 'other';
  status: 'success' | 'failed';
  amount?: number;
  token?: string;
  from?: string;
  to?: string;
  fee: number;
  description: string;
}

export default function TransactionHistory() {
  const { publicKey, connected } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'transfer' | 'swap' | 'stake'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '1d' | '7d' | '30d'>('all');

  useEffect(() => {
    if (connected && publicKey) {
      fetchTransactions();
    }
  }, [connected, publicKey]);

  const fetchTransactions = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const connection = new Connection(RPC_URL);
      
      // Get recent transactions
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        { limit: 50 },
        'finalized'
      );

      const txPromises = signatures.map(async (sig) => {
        try {
          const tx = await connection.getParsedTransaction(sig.signature, 'finalized');
          return parseTransaction(sig, tx);
        } catch (error) {
          console.error('Error fetching transaction:', error);
          return null;
        }
      });

      const parsedTransactions = await Promise.all(txPromises);
      const validTransactions = parsedTransactions.filter(tx => tx !== null) as Transaction[];
      
      setTransactions(validTransactions);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseTransaction = (signature: any, transaction: any): Transaction | null => {
    if (!transaction || !transaction.meta) return null;

    const { blockTime, slot } = transaction;
    const { meta } = transaction;
    const fee = meta.fee / 1e9; // Convert to SOL

    // Basic transaction info
    const baseTransaction: Transaction = {
      signature: signature.signature,
      blockTime: blockTime || 0,
      slot: slot || 0,
      type: 'other',
      status: meta.err ? 'failed' : 'success',
      fee,
      description: 'Unknown transaction'
    };

    // Try to determine transaction type and details
    if (transaction.transaction?.message?.instructions) {
      const instructions = transaction.transaction.message.instructions;
      
      for (const instruction of instructions) {
        // Check for token transfers
        if (instruction.parsed?.type === 'transfer') {
          baseTransaction.type = 'transfer';
          const info = instruction.parsed.info;
          baseTransaction.amount = info.lamports ? info.lamports / 1e9 : undefined;
          baseTransaction.from = info.source;
          baseTransaction.to = info.destination;
          baseTransaction.token = 'SOL';
          baseTransaction.description = `Transfer ${baseTransaction.amount?.toFixed(4)} SOL`;
          break;
        }
        
        // Check for token transfers (SPL tokens)
        if (instruction.parsed?.type === 'transferChecked') {
          baseTransaction.type = 'transfer';
          const info = instruction.parsed.info;
          baseTransaction.amount = info.tokenAmount?.uiAmount;
          baseTransaction.from = info.source;
          baseTransaction.to = info.destination;
          baseTransaction.token = info.mint;
          baseTransaction.description = `Transfer ${baseTransaction.amount?.toFixed(4)} tokens`;
          break;
        }

        // Check for swaps (Jupiter/other DEX patterns)
        if (instruction.programId?.toString().includes('JUP') || 
            instruction.program === 'jupiter' ||
            (instruction.parsed && JSON.stringify(instruction).includes('swap'))) {
          baseTransaction.type = 'swap';
          baseTransaction.description = 'Token swap';
          break;
        }

        // Check for staking operations
        if (instruction.parsed?.type?.includes('stake') || 
            instruction.program === 'stake') {
          baseTransaction.type = 'stake';
          baseTransaction.description = 'Staking operation';
          break;
        }
      }
    }

    return baseTransaction;
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.type === filter);
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = Date.now() / 1000;
      const timeMap = {
        '1d': 24 * 60 * 60,
        '7d': 7 * 24 * 60 * 60,
        '30d': 30 * 24 * 60 * 60
      };
      const timeLimit = now - timeMap[timeFilter];
      filtered = filtered.filter(tx => tx.blockTime >= timeLimit);
    }

    return filtered.sort((a, b) => b.blockTime - a.blockTime);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer': return '💸';
      case 'swap': return '🔄';
      case 'stake': return '🥞';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? '#22c55e' : '#ef4444';
  };

  const filteredTransactions = filterTransactions();

  return (
    <div className="transaction-history">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Transaction History</h2>
            <p className="card-subtitle">{filteredTransactions.length} transactions</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchTransactions}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : '🔄'} Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label className="filter-label">Type:</label>
            <div className="filter-buttons">
              {[
                { value: 'all', label: 'All' },
                { value: 'transfer', label: 'Transfers' },
                { value: 'swap', label: 'Swaps' },
                { value: 'stake', label: 'Staking' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`filter-btn ${filter === option.value ? 'active' : ''}`}
                  onClick={() => setFilter(option.value as any)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Time:</label>
            <div className="filter-buttons">
              {[
                { value: 'all', label: 'All time' },
                { value: '1d', label: '24h' },
                { value: '7d', label: '7d' },
                { value: '30d', label: '30d' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`filter-btn ${timeFilter === option.value ? 'active' : ''}`}
                  onClick={() => setTimeFilter(option.value as any)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            <span>Loading transactions...</span>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="transaction-list">
            {filteredTransactions.map((tx) => (
              <div key={tx.signature} className="transaction-item">
                <div className="transaction-main">
                  <div className="transaction-icon">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-description">{tx.description}</div>
                    <div className="transaction-meta">
                      <span className="transaction-time">
                        {formatDate(tx.blockTime)}
                      </span>
                      <span 
                        className="transaction-status"
                        style={{ color: getStatusColor(tx.status) }}
                      >
                        {tx.status === 'success' ? '✅' : '❌'} {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="transaction-right">
                  {tx.amount && (
                    <div className="transaction-amount">
                      {tx.amount.toFixed(6)} {tx.token || 'SOL'}
                    </div>
                  )}
                  <div className="transaction-fee">
                    Fee: {tx.fee.toFixed(6)} SOL
                  </div>
                </div>

                <div className="transaction-details-expanded">
                  <div className="detail-row">
                    <span>Signature:</span>
                    <a
                      href={`https://solscan.io/tx/${tx.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="signature-link"
                    >
                      {formatAddress(tx.signature)}
                    </a>
                  </div>
                  {tx.from && (
                    <div className="detail-row">
                      <span>From:</span>
                      <span className="address">{formatAddress(tx.from)}</span>
                    </div>
                  )}
                  {tx.to && (
                    <div className="detail-row">
                      <span>To:</span>
                      <span className="address">{formatAddress(tx.to)}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span>Slot:</span>
                    <span>{tx.slot.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No transactions found</div>
            <div className="empty-description">
              {filter === 'all' 
                ? 'Your transaction history will appear here once you start using your wallet.'
                : `No ${filter} transactions found for the selected time period.`
              }
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .transaction-history {
          max-width: 800px;
          margin: 0 auto;
        }

        .filters {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
          padding: 20px;
          background: rgba(15, 23, 42, 0.4);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-label {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
          min-width: 40px;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-color: transparent;
          color: #fff;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 60px;
          color: #94a3b8;
        }

        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .transaction-item {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .transaction-item:hover {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .transaction-main {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .transaction-icon {
          width: 48px;
          height: 48px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .transaction-details {
          flex: 1;
          min-width: 0;
        }

        .transaction-description {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }

        .transaction-meta {
          display: flex;
          gap: 16px;
          align-items: center;
          font-size: 12px;
          color: #94a3b8;
        }

        .transaction-right {
          text-align: right;
          min-width: 120px;
        }

        .transaction-amount {
          font-size: 16px;
          font-weight: 600;
          color: #22c55e;
          margin-bottom: 4px;
        }

        .transaction-fee {
          font-size: 12px;
          color: #94a3b8;
        }

        .transaction-details-expanded {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: 16px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          gap: 12px;
        }

        .detail-row span:first-child {
          color: #94a3b8;
          font-weight: 600;
        }

        .signature-link {
          color: #3b82f6;
          text-decoration: none;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        .signature-link:hover {
          text-decoration: underline;
        }

        .address {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          color: #60a5fa;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
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
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .transaction-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .transaction-icon {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .transaction-right {
            text-align: left;
            min-width: auto;
            width: 100%;
          }

          .transaction-details-expanded {
            grid-template-columns: 1fr;
          }

          .filter-group {
            flex-direction: column;
            align-items: flex-start;
          }

          .filter-buttons {
            width: 100%;
          }

          .filter-btn {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
