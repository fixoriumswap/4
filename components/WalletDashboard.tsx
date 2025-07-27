import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletContext } from './WalletContext';
import { Connection, PublicKey } from '@solana/web3.js';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  logoURI?: string;
  price?: number;
  value?: number;
}

interface WalletStats {
  totalValue: number;
  solBalance: number;
  tokenCount: number;
  recentActivity: number;
}

export default function WalletDashboard() {
  // Support both Gmail and extension wallets
  const { publicKey: extensionKey, connected: extensionConnected } = useWallet();
  const { publicKey: gmailKey, isConnected: gmailConnected, connectionType } = useWalletContext();
  
  const publicKey = gmailKey || extensionKey;
  const connected = gmailConnected || extensionConnected;
  
  const [stats, setStats] = useState<WalletStats>({
    totalValue: 0,
    solBalance: 0,
    tokenCount: 0,
    recentActivity: 0
  });
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey || !connected) {
      setStats({ totalValue: 0, solBalance: 0, tokenCount: 0, recentActivity: 0 });
      setTokenBalances([]);
      return;
    }

    fetchWalletData();
    
    // Refresh data every 15 seconds for real-time updates
    const interval = setInterval(fetchWalletData, 15000);
    return () => clearInterval(interval);
  }, [publicKey, connected]);

  const fetchWalletData = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const connection = new Connection(RPC_URL, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 10000,
      });

      // Fetch SOL balance with retry logic
      let solBalance = 0;
      let retries = 3;
      
      while (retries > 0) {
        try {
          const balance = await connection.getBalance(publicKey, 'confirmed');
          solBalance = balance / Math.pow(10, 9);
          break;
        } catch (balanceError) {
          retries--;
          if (retries === 0) throw balanceError;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Fetch token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') },
        'confirmed'
      );

      const tokens: TokenBalance[] = [];
      
      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info;
        const balance = accountData.tokenAmount.uiAmount;
        
        if (balance && balance > 0) {
          tokens.push({
            mint: accountData.mint,
            symbol: getTokenSymbol(accountData.mint),
            name: getTokenName(accountData.mint),
            balance: balance,
            decimals: accountData.tokenAmount.decimals,
            value: 0 // Will be populated with price data
          });
        }
      }

      // Get SOL price for value calculation
      const solPrice = await getSolPrice();
      
      // Calculate total portfolio value
      const totalTokenValue = tokens.reduce((sum, token) => sum + (token.value || 0), 0);
      const totalValue = (solBalance * solPrice) + totalTokenValue;

      setStats({
        totalValue,
        solBalance,
        tokenCount: tokens.length,
        recentActivity: 0 // This would require transaction history analysis
      });

      setTokenBalances([
        {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Solana',
          balance: solBalance,
          decimals: 9,
          price: solPrice,
          value: solBalance * solPrice
        },
        ...tokens
      ]);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setError('Failed to fetch wallet data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTokenSymbol = (mint: string): string => {
    const knownTokens: Record<string, string> = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
      'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'bSOL',
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'JitoSOL',
    };
    return knownTokens[mint] || `Token ${mint.slice(0, 4)}...`;
  };

  const getTokenName = (mint: string): string => {
    const knownTokens: Record<string, string> = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USD Coin',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'Tether USD',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'Marinade SOL',
      'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'BlazeStake SOL',
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'Jito SOL',
    };
    return knownTokens[mint] || 'Unknown Token';
  };

  const getSolPrice = async (): Promise<number> => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.solana?.usd || 0;
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      return 0; // Return 0 if price fetch fails
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 4) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const refreshData = () => {
    fetchWalletData();
  };

  const getConnectionTypeDisplay = () => {
    if (connectionType === 'gmail') return 'Gmail Wallet';
    if (extensionConnected) return 'Extension Wallet';
    return 'Connected Wallet';
  };

  return (
    <div className="wallet-dashboard">
      {/* Connection Status */}
      <div className="connection-status-card">
        <div className="status-indicator">
          <div className="status-dot"></div>
          <div className="status-text">
            <h4>{getConnectionTypeDisplay()}</h4>
            <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>
          </div>
        </div>
        <button 
          className="refresh-button" 
          onClick={refreshData}
          disabled={loading}
        >
          {loading ? '🔄' : '↻'} {loading ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-card">
          <span className="error-icon">⚠️</span>
          <div className="error-content">
            <strong>Error:</strong> {error}
            <button onClick={refreshData} className="retry-button">Try Again</button>
          </div>
        </div>
      )}

      {/* Portfolio Overview */}
      <div className="overview-card">
        <div className="card-header">
          <h2>Portfolio Overview</h2>
          <div className="portfolio-actions">
            <button className="action-btn send">
              <span>💸</span> Send
            </button>
            <button className="action-btn receive">
              <span>📥</span> Receive
            </button>
            <button className="action-btn swap">
              <span>🔄</span> Swap
            </button>
          </div>
        </div>
        
        <div className="portfolio-stats">
          <div className="stat-card main-balance">
            <div className="stat-label">Total Portfolio Value</div>
            <div className="stat-value large">{formatCurrency(stats.totalValue)}</div>
            <div className="stat-change positive">+2.5% (24h)</div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">SOL Balance</div>
              <div className="stat-value">{formatNumber(stats.solBalance, 6)} SOL</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Token Holdings</div>
              <div className="stat-value">{stats.tokenCount} Tokens</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">24h Volume</div>
              <div className="stat-value">-</div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Holdings */}
      <div className="holdings-card">
        <div className="card-header">
          <h3>Token Holdings</h3>
          <span className="token-count">{tokenBalances.length} assets</span>
        </div>
        
        {loading && tokenBalances.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading your portfolio...</span>
          </div>
        ) : tokenBalances.length > 0 ? (
          <div className="token-list">
            {tokenBalances.map((token, index) => (
              <div key={token.mint || index} className="token-item">
                <div className="token-info">
                  <div className="token-icon">
                    {token.logoURI ? (
                      <img src={token.logoURI} alt={token.symbol} className="token-logo" />
                    ) : (
                      <div className="token-placeholder">
                        {token.symbol.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="token-details">
                    <div className="token-symbol">{token.symbol}</div>
                    <div className="token-name">{token.name}</div>
                  </div>
                </div>
                <div className="token-balance">
                  <div className="balance-amount">{formatNumber(token.balance, 6)}</div>
                  <div className="balance-value">
                    {token.value ? formatCurrency(token.value) : '-'}
                  </div>
                </div>
                <div className="token-actions">
                  <button className="token-action-btn">📊</button>
                  <button className="token-action-btn">💸</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💎</div>
            <div className="empty-title">No tokens found</div>
            <div className="empty-description">
              Your token holdings will appear here. Start by receiving some tokens to your wallet.
            </div>
            <button className="empty-action-btn">Get Started</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .wallet-dashboard {
          max-width: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .connection-status-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }

        .status-text h4 {
          margin: 0 0 4px 0;
          color: white;
          font-size: 16px;
          font-weight: 600;
        }

        .status-text p {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
        }

        .refresh-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .refresh-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-card {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .error-icon {
          font-size: 20px;
        }

        .error-content {
          flex: 1;
          color: #fca5a5;
          font-size: 14px;
        }

        .retry-button {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 8px;
          color: #fca5a5;
          padding: 4px 12px;
          cursor: pointer;
          font-size: 12px;
          margin-left: 12px;
        }

        .overview-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          padding: 32px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .card-header h2 {
          margin: 0;
          color: white;
          font-size: 24px;
          font-weight: 700;
        }

        .card-header h3 {
          margin: 0;
          color: white;
          font-size: 20px;
          font-weight: 600;
        }

        .portfolio-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .portfolio-stats {
          display: grid;
          gap: 24px;
        }

        .main-balance {
          text-align: center;
          padding: 32px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
        }

        .stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }

        .stat-value.large {
          font-size: 36px;
          margin-bottom: 8px;
        }

        .stat-change {
          font-size: 12px;
          font-weight: 500;
        }

        .stat-change.positive {
          color: #22c55e;
        }

        .holdings-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          padding: 32px;
        }

        .token-count {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px;
          color: rgba(255, 255, 255, 0.7);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .token-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .token-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          transition: all 0.2s ease;
        }

        .token-item:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .token-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .token-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .token-logo {
          width: 48px;
          height: 48px;
          border-radius: 50%;
        }

        .token-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
          color: white;
        }

        .token-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .token-symbol {
          font-size: 16px;
          font-weight: 600;
          color: white;
        }

        .token-name {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .token-balance {
          text-align: right;
          margin-right: 16px;
        }

        .balance-amount {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
        }

        .balance-value {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .token-actions {
          display: flex;
          gap: 8px;
        }

        .token-action-btn {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .token-action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .empty-title {
          font-size: 20px;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
        }

        .empty-description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          max-width: 400px;
          margin: 0 auto 24px;
          line-height: 1.5;
        }

        .empty-action-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border: none;
          border-radius: 12px;
          color: white;
          padding: 12px 24px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .empty-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
        }

        @media (max-width: 768px) {
          .overview-card,
          .holdings-card {
            padding: 20px;
          }

          .portfolio-actions {
            flex-direction: column;
            gap: 8px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .stat-value.large {
            font-size: 28px;
          }

          .token-item {
            padding: 16px;
          }

          .token-balance {
            margin-right: 0;
          }

          .connection-status-card {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
