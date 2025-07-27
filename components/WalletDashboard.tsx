import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
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
  const { publicKey, connected } = useWallet();
  const [stats, setStats] = useState<WalletStats>({
    totalValue: 0,
    solBalance: 0,
    tokenCount: 0,
    recentActivity: 0
  });
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!publicKey || !connected) {
      setStats({ totalValue: 0, solBalance: 0, tokenCount: 0, recentActivity: 0 });
      setTokenBalances([]);
      return;
    }

    fetchWalletData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchWalletData, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connected]);

  const fetchWalletData = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const connection = new Connection(RPC_URL, {
        commitment: 'finalized',
        confirmTransactionInitialTimeout: 10000,
      });

      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey, 'finalized');
      const solAmount = solBalance / Math.pow(10, 9);

      // Fetch token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') },
        'finalized'
      );

      const tokens: TokenBalance[] = [];
      
      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info;
        const balance = accountData.tokenAmount.uiAmount;
        
        if (balance && balance > 0) {
          tokens.push({
            mint: accountData.mint,
            symbol: 'Unknown',
            name: 'Unknown Token',
            balance: balance,
            decimals: accountData.tokenAmount.decimals,
            value: 0
          });
        }
      }

      // Fetch token metadata for known tokens
      await enrichTokenData(tokens);

      // Calculate total portfolio value
      const totalTokenValue = tokens.reduce((sum, token) => sum + (token.value || 0), 0);
      const solPrice = await getSolPrice();
      const totalValue = (solAmount * solPrice) + totalTokenValue;

      setStats({
        totalValue,
        solBalance: solAmount,
        tokenCount: tokens.length,
        recentActivity: 0 // This would require transaction history
      });

      setTokenBalances([
        {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Solana',
          balance: solAmount,
          decimals: 9,
          price: solPrice,
          value: solAmount * solPrice
        },
        ...tokens
      ]);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrichTokenData = async (tokens: TokenBalance[]) => {
    // This would typically fetch from a token list API
    const knownTokens: Record<string, { symbol: string; name: string; logoURI?: string }> = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin' },
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD' },
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade SOL' },
      'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': { symbol: 'bSOL', name: 'Blaze SOL' },
    };

    tokens.forEach(token => {
      const knownToken = knownTokens[token.mint];
      if (knownToken) {
        token.symbol = knownToken.symbol;
        token.name = knownToken.name;
        token.logoURI = knownToken.logoURI;
      }
    });
  };

  const getSolPrice = async (): Promise<number> => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      return data.solana?.usd || 0;
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      return 0;
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

  return (
    <div className="wallet-dashboard">
      {/* Portfolio Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Portfolio Overview</h2>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={refreshData}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : '🔄'} Refresh
          </button>
        </div>
        
        <div className="portfolio-stats grid grid-4">
          <div className="stat-card">
            <div className="stat-label">Total Value</div>
            <div className="stat-value">{formatCurrency(stats.totalValue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">SOL Balance</div>
            <div className="stat-value">{formatNumber(stats.solBalance)} SOL</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Token Holdings</div>
            <div className="stat-value">{stats.tokenCount} Tokens</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Last Updated</div>
            <div className="stat-value-sm">{lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Token Holdings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Token Holdings</h3>
          <span className="card-subtitle">{tokenBalances.length} tokens</span>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            <span>Loading token balances...</span>
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
                  <div className="balance-amount">{formatNumber(token.balance)}</div>
                  <div className="balance-value">
                    {token.value ? formatCurrency(token.value) : '$0.00'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <div className="empty-title">No tokens found</div>
            <div className="empty-description">
              Your token holdings will appear here once you have some tokens in your wallet.
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        
        <div className="quick-actions grid grid-3">
          <button className="action-card">
            <div className="action-icon">💸</div>
            <div className="action-title">Send</div>
            <div className="action-description">Send tokens to another wallet</div>
          </button>
          <button className="action-card">
            <div className="action-icon">📥</div>
            <div className="action-title">Receive</div>
            <div className="action-description">Show your wallet address</div>
          </button>
          <button className="action-card">
            <div className="action-icon">🔄</div>
            <div className="action-title">Swap</div>
            <div className="action-description">Exchange tokens</div>
          </button>
        </div>
      </div>

      <style jsx>{`
        .wallet-dashboard {
          max-width: 100%;
        }

        .portfolio-stats {
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
          margin-bottom: 4px;
        }

        .stat-value-sm {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
          color: #94a3b8;
        }

        .token-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .token-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(15, 23, 42, 0.4);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }

        .token-item:hover {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .token-info {
          display: flex;
          align-items: center;
          gap: 16px;
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
          color: #fff;
        }

        .token-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .token-symbol {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
        }

        .token-name {
          font-size: 14px;
          color: #94a3b8;
        }

        .token-balance {
          text-align: right;
        }

        .balance-amount {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          margin-bottom: 4px;
        }

        .balance-value {
          font-size: 14px;
          color: #94a3b8;
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

        .quick-actions {
          margin-top: 24px;
        }

        .action-card {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .action-card:hover {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .action-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .action-title {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          margin-bottom: 4px;
        }

        .action-description {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .portfolio-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .quick-actions {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .token-item {
            padding: 12px;
          }

          .token-info {
            gap: 12px;
          }

          .token-icon,
          .token-logo,
          .token-placeholder {
            width: 40px;
            height: 40px;
          }

          .stat-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
