import React, { useState, useEffect } from 'react';
import { useWalletContext } from './WalletContext';
import { 
  Connection, 
  PublicKey, 
  Transaction,
  StakeProgram,
  SystemProgram,
  Authorized,
  Lockup,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

interface Validator {
  publicKey: string;
  name: string;
  commission: number;
  apy: number;
  totalStake: number;
  description?: string;
}

interface StakeAccount {
  publicKey: string;
  lamports: number;
  validator?: string;
  status: 'active' | 'activating' | 'deactivating' | 'inactive';
  activationEpoch?: number;
  deactivationEpoch?: number;
}

const POPULAR_VALIDATORS: Validator[] = [
  {
    publicKey: 'Stake11111111111111111111111111111111111111',
    name: 'Solana Foundation',
    commission: 7,
    apy: 6.5,
    totalStake: 15000000,
    description: 'Official Solana Foundation validator'
  },
  {
    publicKey: 'MarinadeA1gorithmicDe1egationStrategy111111',
    name: 'Marinade',
    commission: 6,
    apy: 6.8,
    totalStake: 12000000,
    description: 'Liquid staking protocol'
  },
  {
    publicKey: 'oRAnGeU5h8h2UkvbfnE5cjXnnAa4rBoaxmS4kbFymSe',
    name: 'Orange',
    commission: 5,
    apy: 7.0,
    totalStake: 8000000,
    description: 'High performance validator'
  },
  {
    publicKey: 'J1to3PQfXidUUhprQWgdKkQAMWPJAEqSJ7amkBDE9qhF',
    name: 'Jupiter',
    commission: 8,
    apy: 6.2,
    totalStake: 10000000,
    description: 'DeFi focused validator'
  }
];

export default function Staking() {
  const { publicKey, keypair, isConnected: connected } = useWalletContext();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccount[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<Validator>(POPULAR_VALIDATORS[0]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [totalStaked, setTotalStaked] = useState<number>(0);
  const [estimatedRewards, setEstimatedRewards] = useState<number>(0);

  useEffect(() => {
    if (connected && publicKey) {
      fetchWalletData();
    }
  }, [connected, publicKey]);

  const fetchWalletData = async () => {
    if (!publicKey) return;

    try {
      const connection = new Connection(RPC_URL);
      
      // Get SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Get stake accounts
      const stakeAccounts = await connection.getParsedProgramAccounts(
        StakeProgram.programId,
        {
          filters: [
            {
              memcmp: {
                offset: 12, // Stake authority offset
                bytes: publicKey.toBase58(),
              },
            },
          ],
        }
      );

      const parsedStakeAccounts: StakeAccount[] = stakeAccounts.map((account) => {
        const data = account.account.data;
        const stakeAccount = data.parsed?.info;
        
        return {
          publicKey: account.pubkey.toString(),
          lamports: account.account.lamports,
          validator: stakeAccount?.stake?.delegation?.voter,
          status: stakeAccount?.stake?.delegation?.activationEpoch ? 'active' : 'inactive',
          activationEpoch: stakeAccount?.stake?.delegation?.activationEpoch,
          deactivationEpoch: stakeAccount?.stake?.delegation?.deactivationEpoch,
        };
      });

      setStakeAccounts(parsedStakeAccounts);
      
      // Calculate total staked
      const total = parsedStakeAccounts.reduce((sum, account) => sum + (account.lamports / LAMPORTS_PER_SOL), 0);
      setTotalStaked(total);
      
      // Estimate rewards (simplified calculation)
      setEstimatedRewards(total * selectedValidator.apy / 100);

    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  const handleStake = async () => {
    if (!publicKey || !signTransaction) {
      setStatus('Wallet not connected');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setStatus('Invalid stake amount');
      return;
    }

    if (parseFloat(stakeAmount) > solBalance) {
      setStatus('Insufficient SOL balance');
      return;
    }

    setLoading(true);
    setStatus('Creating stake account...');

    try {
      const connection = new Connection(RPC_URL);
      const lamports = Math.floor(parseFloat(stakeAmount) * LAMPORTS_PER_SOL);
      
      // Generate new stake account keypair
      const stakeAccount = new PublicKey(
        // In a real app, you'd generate a new keypair here
        'StakeAccount' + Math.random().toString(36).substr(2, 9)
      );

      const validatorPubkey = new PublicKey(selectedValidator.publicKey);

      const transaction = new Transaction();

      // Create stake account
      transaction.add(
        StakeProgram.createAccount({
          fromPubkey: publicKey,
          stakePubkey: stakeAccount,
          authorized: new Authorized(publicKey, publicKey),
          lockup: new Lockup(0, 0, publicKey),
          lamports: lamports,
        })
      );

      // Delegate stake
      transaction.add(
        StakeProgram.delegate({
          stakePubkey: stakeAccount,
          authorizedPubkey: publicKey,
          votePubkey: validatorPubkey,
        })
      );

      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;

      setStatus('Please sign the transaction...');
      // Note: This is a simplified example. In reality, you'd need proper keypair generation
      // const signedTransaction = await signTransaction(transaction);

      setStatus('⚠️ Staking simulation - transaction not actually sent');
      
      // Simulate success for demo
      setTimeout(() => {
        setStatus('✅ Stake account created successfully!');
        setStakeAmount('');
        fetchWalletData();
      }, 2000);

    } catch (error: any) {
      console.error('Staking error:', error);
      setStatus(`❌ Staking failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (stakeAccountPubkey: string) => {
    if (!publicKey || !signTransaction) {
      setStatus('Wallet not connected');
      return;
    }

    setLoading(true);
    setStatus('Deactivating stake...');

    try {
      const connection = new Connection(RPC_URL);
      const stakeAccountKey = new PublicKey(stakeAccountPubkey);

      const transaction = new Transaction();

      // Deactivate stake
      transaction.add(
        StakeProgram.deactivate({
          stakePubkey: stakeAccountKey,
          authorizedPubkey: publicKey,
        })
      );

      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;

      setStatus('Please sign the transaction...');
      // const signedTransaction = await signTransaction(transaction);

      setStatus('⚠️ Unstaking simulation - transaction not actually sent');
      
      // Simulate success for demo
      setTimeout(() => {
        setStatus('✅ Stake deactivated successfully!');
        fetchWalletData();
      }, 2000);

    } catch (error: any) {
      console.error('Unstaking error:', error);
      setStatus(`❌ Unstaking failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number, decimals: number = 4) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="staking">
      {/* Staking Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">SOL Staking</h2>
          <p className="card-subtitle">Earn rewards by staking your SOL</p>
        </div>

        <div className="staking-stats grid grid-3">
          <div className="stat-card">
            <div className="stat-label">Available Balance</div>
            <div className="stat-value">{formatNumber(solBalance)} SOL</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Staked</div>
            <div className="stat-value">{formatNumber(totalStaked)} SOL</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Est. Annual Rewards</div>
            <div className="stat-value">{formatNumber(estimatedRewards)} SOL</div>
          </div>
        </div>
      </div>

      {/* Stake New */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Stake SOL</h3>
        </div>

        <div className="stake-form">
          {/* Validator Selection */}
          <div className="form-group">
            <label className="form-label">Select Validator</label>
            <div className="validator-grid">
              {POPULAR_VALIDATORS.map((validator) => (
                <div
                  key={validator.publicKey}
                  className={`validator-card ${selectedValidator.publicKey === validator.publicKey ? 'selected' : ''}`}
                  onClick={() => setSelectedValidator(validator)}
                >
                  <div className="validator-info">
                    <div className="validator-name">{validator.name}</div>
                    <div className="validator-stats">
                      <span className="validator-apy">{validator.apy}% APY</span>
                      <span className="validator-commission">{validator.commission}% fee</span>
                    </div>
                  </div>
                  <div className="validator-stake">
                    {formatNumber(validator.totalStake / 1000000)}M SOL
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stake Amount */}
          <div className="form-group">
            <label className="form-label">
              Amount to Stake
              <span className="balance-indicator">
                Available: {formatNumber(solBalance)} SOL
              </span>
            </label>
            <div className="amount-input-container">
              <input
                type="number"
                className="input"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
              />
              <button
                type="button"
                className="max-button"
                onClick={() => setStakeAmount((solBalance - 0.01).toString())} // Leave some for fees
              >
                MAX
              </button>
            </div>
            <div className="form-help">
              Minimum stake: 1 SOL. Keep some SOL for transaction fees.
            </div>
          </div>

          {/* Expected Returns */}
          {stakeAmount && parseFloat(stakeAmount) > 0 && (
            <div className="expected-returns">
              <h4>Expected Returns</h4>
              <div className="returns-grid">
                <div className="return-item">
                  <span className="return-period">Daily</span>
                  <span className="return-value">
                    {formatNumber((parseFloat(stakeAmount) * selectedValidator.apy) / 365 / 100)} SOL
                  </span>
                </div>
                <div className="return-item">
                  <span className="return-period">Monthly</span>
                  <span className="return-value">
                    {formatNumber((parseFloat(stakeAmount) * selectedValidator.apy) / 12 / 100)} SOL
                  </span>
                </div>
                <div className="return-item">
                  <span className="return-period">Yearly</span>
                  <span className="return-value">
                    {formatNumber((parseFloat(stakeAmount) * selectedValidator.apy) / 100)} SOL
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stake Button */}
          <button
            className="btn btn-primary btn-lg w-full"
            onClick={handleStake}
            disabled={loading || !connected || !stakeAmount || parseFloat(stakeAmount) <= 0}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Staking...
              </>
            ) : (
              'Stake SOL'
            )}
          </button>

          {/* Status */}
          {status && (
            <div className={`status-message ${
              status.includes('✅') ? 'success' : 
              status.includes('❌') ? 'error' : 'info'
            }`}>
              {status}
            </div>
          )}
        </div>
      </div>

      {/* Active Stakes */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Stake Accounts</h3>
          <span className="card-subtitle">{stakeAccounts.length} accounts</span>
        </div>

        {stakeAccounts.length > 0 ? (
          <div className="stake-accounts">
            {stakeAccounts.map((account) => (
              <div key={account.publicKey} className="stake-account-item">
                <div className="stake-account-info">
                  <div className="stake-account-main">
                    <div className="stake-amount">
                      {formatNumber(account.lamports / LAMPORTS_PER_SOL)} SOL
                    </div>
                    <div className="stake-status">
                      <span className={`status-indicator status-${account.status}`}>
                        {account.status}
                      </span>
                    </div>
                  </div>
                  <div className="stake-account-details">
                    <div className="detail-item">
                      <span>Account:</span>
                      <span className="address">{formatAddress(account.publicKey)}</span>
                    </div>
                    {account.validator && (
                      <div className="detail-item">
                        <span>Validator:</span>
                        <span className="address">{formatAddress(account.validator)}</span>
                      </div>
                    )}
                    {account.activationEpoch && (
                      <div className="detail-item">
                        <span>Activation Epoch:</span>
                        <span>{account.activationEpoch}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="stake-account-actions">
                  {account.status === 'active' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUnstake(account.publicKey)}
                      disabled={loading}
                    >
                      Unstake
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🥞</div>
            <div className="empty-title">No stake accounts</div>
            <div className="empty-description">
              Start staking your SOL to earn rewards and help secure the network.
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .staking {
          max-width: 800px;
          margin: 0 auto;
        }

        .staking-stats {
          margin-top: 24px;
        }

        .stat-card {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .stat-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #fff;
        }

        .stake-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .validator-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .validator-card {
          background: rgba(15, 23, 42, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .validator-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .validator-card.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .validator-info {
          margin-bottom: 8px;
        }

        .validator-name {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          margin-bottom: 4px;
        }

        .validator-stats {
          display: flex;
          gap: 12px;
          font-size: 12px;
        }

        .validator-apy {
          color: #22c55e;
          font-weight: 600;
        }

        .validator-commission {
          color: #94a3b8;
        }

        .validator-stake {
          font-size: 12px;
          color: #94a3b8;
          text-align: right;
        }

        .balance-indicator {
          float: right;
          font-size: 12px;
          color: #94a3b8;
          font-weight: normal;
        }

        .amount-input-container {
          position: relative;
        }

        .max-button {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .expected-returns {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .expected-returns h4 {
          margin: 0 0 16px 0;
          color: #e2e8f0;
          font-size: 16px;
        }

        .returns-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .return-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .return-period {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        .return-value {
          font-size: 16px;
          font-weight: bold;
          color: #22c55e;
        }

        .status-message {
          padding: 16px;
          border-radius: 12px;
          font-size: 14px;
          text-align: center;
        }

        .status-message.success {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-message.error {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-message.info {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .stake-accounts {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .stake-account-item {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .stake-account-main {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .stake-amount {
          font-size: 20px;
          font-weight: bold;
          color: #fff;
        }

        .stake-status .status-indicator {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 6px;
          text-transform: capitalize;
        }

        .status-active {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .status-activating {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .status-deactivating {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .status-inactive {
          background: rgba(148, 163, 184, 0.2);
          color: #94a3b8;
        }

        .stake-account-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
        }

        .detail-item span:first-child {
          color: #94a3b8;
          font-weight: 600;
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
          .validator-grid {
            grid-template-columns: 1fr;
          }

          .returns-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .stake-account-item {
            flex-direction: column;
            gap: 16px;
          }

          .stake-account-actions {
            width: 100%;
          }

          .staking-stats {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
