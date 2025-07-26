import React, { useState, useEffect } from 'react';
import TokenDetails from './TokenDetails';

interface TrendingToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
  address?: string;
}

interface TrendingTokensProps {
  onClose: () => void;
}

export default function TrendingTokens({ onClose }: TrendingTokensProps) {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<TrendingToken | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Solana network trending tokens with verified Jupiter-compatible addresses
  const solanaTokens = [
    { id: 'solana', address: 'So11111111111111111111111111111111111111112' },
    { id: 'usd-coin', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    { id: 'tether', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
    { id: 'bonk', address: 'DezXAZ8z7PnrnRJjz3wXBoRhwTLdMPkqhuBczetogeoK' },
    { id: 'dogwifcoin', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBtUk6goG7zcX3New' },
    { id: 'jito-governance-token', address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn' },
    { id: 'jupiter-exchange-solana', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
    { id: 'raydium', address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' }
  ];

  useEffect(() => {
    fetchTrendingTokens();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTrendingTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrendingTokens = async () => {
    try {
      setError(null);
      
      // Get token IDs for CoinGecko API
      const tokenIds = solanaTokens.map(token => token.id).join(',');
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${tokenIds}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch token data');
      }

      const data = await response.json();
      
      // Add contract addresses to the data
      const enrichedData = data.map((token: any) => {
        const solanaToken = solanaTokens.find(st => st.id === token.id);
        return {
          ...token,
          address: solanaToken?.address || token.id
        };
      });

      setTokens(enrichedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      setError('Failed to load trending tokens');
      setLoading(false);
      
      // Fallback to static data
      const fallbackTokens: TrendingToken[] = [
        {
          id: 'solana',
          symbol: 'SOL',
          name: 'Solana',
          image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
          current_price: 145.50,
          price_change_percentage_24h: 2.5,
          market_cap: 67000000000,
          volume_24h: 2100000000,
          address: 'So11111111111111111111111111111111111111112'
        },
        {
          id: 'bonk',
          symbol: 'BONK',
          name: 'Bonk',
          image: 'https://assets.coingecko.com/coins/images/28600/large/bonk.jpg',
          current_price: 0.000024,
          price_change_percentage_24h: 8.2,
          market_cap: 1800000000,
          volume_24h: 150000000,
          address: 'DezXAZ8z7PnrnRJjz3wXBoRhwTLdMPkqhuBczetogeoK'
        },
        {
          id: 'dogwifcoin',
          symbol: 'WIF',
          name: 'dogwifhat',
          image: 'https://assets.coingecko.com/coins/images/33767/large/dogwifhat.jpg',
          current_price: 2.45,
          price_change_percentage_24h: -1.2,
          market_cap: 2400000000,
          volume_24h: 180000000,
          address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBtUk6goG7zcX3New'
        }
      ];
      setTokens(fallbackTokens);
    }
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(2)}`;
    }
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(1)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(1)}M`;
    } else {
      return `$${(marketCap / 1e3).toFixed(1)}K`;
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content trending-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📈 Trending on Solana</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="trending-content">
            {loading ? (
              <div className="loading-container">
                <span className="spinner" />
                <p>Loading trending tokens...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p>⚠️ {error}</p>
                <button onClick={fetchTrendingTokens} className="retry-btn">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="trending-header">
                  <p>Most popular tokens on Solana network</p>
                  <button onClick={fetchTrendingTokens} className="refresh-btn" title="Refresh">
                    🔄
                  </button>
                </div>

                <div className="tokens-list">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      className="token-card"
                      onClick={() => setSelectedToken(token)}
                    >
                      <div className="token-info">
                        <img 
                          src={token.image} 
                          alt={token.symbol}
                          className="token-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40/29D6B6/FFFFFF?text=' + token.symbol.charAt(0);
                          }}
                        />
                        <div className="token-details">
                          <div className="token-name-symbol">
                            <span className="token-symbol">{token.symbol.toUpperCase()}</span>
                            <span className="token-name">{token.name}</span>
                          </div>
                          <div className="token-market-cap">
                            MC: {formatMarketCap(token.market_cap)}
                          </div>
                        </div>
                      </div>

                      <div className="token-prices">
                        <div className="current-price">
                          {formatPrice(token.current_price)}
                        </div>
                        <div className={`price-change ${token.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                          {formatChange(token.price_change_percentage_24h)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="trending-footer">
                  <p className="data-source">
                    💡 Data provided by CoinGecko • Updates every 30 seconds
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedToken && (
        <TokenDetails 
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
        />
      )}
    </>
  );
}
