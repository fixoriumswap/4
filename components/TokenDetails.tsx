import React, { useState, useEffect } from 'react';

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

interface TokenDetailsProps {
  token: TrendingToken;
  onClose: () => void;
}

export default function TokenDetails({ token, onClose }: TokenDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'chart'>('overview');
  const [tokenStats, setTokenStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetailedStats();
  }, [token.id]);

  const fetchDetailedStats = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${token.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        setTokenStats(data);
      }
    } catch (error) {
      console.error('Error fetching detailed stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyToken = () => {
    // Pass token data to swap page
    const swapData = {
      fromToken: {
        address: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Solana",
        decimals: 9
      },
      toToken: {
        address: token.address || token.id,
        symbol: token.symbol,
        name: token.name,
        decimals: token.symbol === 'USDC' ? 6 : token.symbol === 'BONK' ? 5 : 9,
        logoURI: token.image
      }
    };

    // Store in localStorage for SwapForm to pick up
    localStorage.setItem('swapData', JSON.stringify(swapData));
    
    // Dispatch custom event to notify SwapForm
    window.dispatchEvent(new CustomEvent('tokenSelected', { detail: swapData }));
    
    onClose();
    
    // Scroll to swap form
    setTimeout(() => {
      const swapForm = document.querySelector('.swap-form');
      if (swapForm) {
        swapForm.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSellToken = () => {
    // Pass token data to swap page (reverse direction)
    const swapData = {
      fromToken: {
        address: token.address || token.id,
        symbol: token.symbol,
        name: token.name,
        decimals: token.symbol === 'USDC' ? 6 : token.symbol === 'BONK' ? 5 : 9,
        logoURI: token.image
      },
      toToken: {
        address: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Solana",
        decimals: 9
      }
    };

    localStorage.setItem('swapData', JSON.stringify(swapData));
    window.dispatchEvent(new CustomEvent('tokenSelected', { detail: swapData }));
    
    onClose();
    
    setTimeout(() => {
      const swapForm = document.querySelector('.swap-form');
      if (swapForm) {
        swapForm.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
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

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    } else {
      return `$${(volume / 1e3).toFixed(2)}K`;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content token-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="token-header-info">
            <img 
              src={token.image} 
              alt={token.symbol}
              className="token-header-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32/29D6B6/FFFFFF?text=' + token.symbol.charAt(0);
              }}
            />
            <div>
              <h2>{token.name}</h2>
              <span className="token-symbol-header">{token.symbol.toUpperCase()}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="token-price-section">
          <div className="current-price-large">
            {formatPrice(token.current_price)}
          </div>
          <div className={`price-change-large ${token.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
            {token.price_change_percentage_24h >= 0 ? '▲' : '▼'} 
            {Math.abs(token.price_change_percentage_24h).toFixed(2)}% (24h)
          </div>
        </div>

        <div className="action-buttons">
          <button className="buy-btn" onClick={handleBuyToken}>
            🟢 Buy {token.symbol.toUpperCase()}
          </button>
          <button className="sell-btn" onClick={handleSellToken}>
            🔴 Sell {token.symbol.toUpperCase()}
          </button>
        </div>

        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            Statistics
          </button>
        </div>

        <div className="token-details-content">
          {activeTab === 'overview' ? (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Market Cap</span>
                  <span className="stat-value">{formatVolume(token.market_cap)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">24h Volume</span>
                  <span className="stat-value">{formatVolume(token.volume_24h)}</span>
                </div>
                {tokenStats && (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">24h High</span>
                      <span className="stat-value">
                        {formatPrice(tokenStats.market_data?.high_24h?.usd || 0)}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">24h Low</span>
                      <span className="stat-value">
                        {formatPrice(tokenStats.market_data?.low_24h?.usd || 0)}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">All Time High</span>
                      <span className="stat-value">
                        {formatPrice(tokenStats.market_data?.ath?.usd || 0)}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Market Cap Rank</span>
                      <span className="stat-value">#{tokenStats.market_cap_rank || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>

              {token.address && (
                <div className="contract-info">
                  <h4>Contract Address</h4>
                  <div className="contract-address">
                    <span className="address-text">{token.address}</span>
                    <button 
                      className="copy-contract-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(token.address!);
                        alert('Contract address copied!');
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              {tokenStats?.description?.en && (
                <div className="token-description">
                  <h4>About {token.name}</h4>
                  <p>{tokenStats.description.en.slice(0, 300)}...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="statistics-section">
              {loading ? (
                <div className="loading-stats">
                  <span className="spinner" />
                  <p>Loading detailed statistics...</p>
                </div>
              ) : tokenStats ? (
                <div className="detailed-stats">
                  <div className="price-changes">
                    <h4>Price Changes</h4>
                    <div className="change-grid">
                      <div className="change-item">
                        <span>1h</span>
                        <span className={tokenStats.market_data?.price_change_percentage_1h_in_currency?.usd >= 0 ? 'positive' : 'negative'}>
                          {tokenStats.market_data?.price_change_percentage_1h_in_currency?.usd?.toFixed(2) || 'N/A'}%
                        </span>
                      </div>
                      <div className="change-item">
                        <span>7d</span>
                        <span className={tokenStats.market_data?.price_change_percentage_7d >= 0 ? 'positive' : 'negative'}>
                          {tokenStats.market_data?.price_change_percentage_7d?.toFixed(2) || 'N/A'}%
                        </span>
                      </div>
                      <div className="change-item">
                        <span>30d</span>
                        <span className={tokenStats.market_data?.price_change_percentage_30d >= 0 ? 'positive' : 'negative'}>
                          {tokenStats.market_data?.price_change_percentage_30d?.toFixed(2) || 'N/A'}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {tokenStats.market_data?.sparkline_7d?.price && (
                    <div className="price-chart-mini">
                      <h4>7-Day Price Trend</h4>
                      <div className="sparkline">
                        <svg width="100%" height="60" viewBox="0 0 168 60">
                          <polyline
                            fill="none"
                            stroke={token.price_change_percentage_24h >= 0 ? "#4caf50" : "#f44336"}
                            strokeWidth="2"
                            points={
                              tokenStats.market_data.sparkline_7d.price
                                .map((price: number, index: number) => `${index * 2},${60 - (price / Math.max(...tokenStats.market_data.sparkline_7d.price)) * 60}`)
                                .join(' ')
                            }
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-stats">
                  <p>📊 Detailed statistics not available</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="token-details-footer">
          <p className="disclaimer">
            ⚠️ Trading involves risk. Always do your own research before investing.
          </p>
        </div>
      </div>
    </div>
  );
}
