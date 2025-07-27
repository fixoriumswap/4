import React, { useEffect, useState } from 'react';

interface CryptoLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

export default function CryptoLoader({ onComplete, duration = 5000 }: CryptoLoaderProps) {
  const [timeLeft, setTimeLeft] = useState(duration / 1000);

  useEffect(() => {
    if (!onComplete) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete, duration]);
  const cryptoCoins = [
    { name: 'SOL', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', color: '#9945FF' },
    { name: 'BONK', logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I', color: '#FF6B35' },
    { name: 'WIF', logo: 'https://bafkreicrjgjei47pz6ue5d3mi5kgurjclqxfyqfhywu5w6fhmzpe6q5afm.ipfs.nftstorage.link', color: '#FFE66D' },
    { name: 'USDC', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', color: '#2775CA' },
    { name: 'JUP', logo: 'https://station.jup.ag/favicon.ico', color: '#FBA43A' },
    { name: 'RAY', logo: 'https://cryptologos.cc/logos/raydium-ray-logo.png', color: '#C200FB' },
  ];

  return (
    <div className="crypto-loader-container">
      <div className="loader-content">
        <h1 className="loader-title">FIXORIUM</h1>
        <p className="loader-subtitle">Solana & Pump.fun Wallet</p>
        
        <div className="crypto-orbit">
          <div className="orbit-center">
            <div className="center-logo">
              <svg viewBox="0 0 64 64" className="fixorium-logo">
                <circle cx="32" cy="32" r="32" fill="#29D6B6"/>
                <text x="32" y="42" textAnchor="middle" fontSize="28" fill="#23272F" fontFamily="Arial" fontWeight="bold">F</text>
              </svg>
            </div>
          </div>

          {cryptoCoins.map((coin, index) => (
            <div 
              key={coin.name}
              className={`orbit-coin coin-${index + 1}`}
              style={{ '--coin-color': coin.color } as React.CSSProperties}
            >
              <div className="coin-wrapper">
                <img 
                  src={coin.logo} 
                  alt={coin.name}
                  className="coin-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/40/${coin.color.replace('#', '')}/FFFFFF?text=${coin.name}`;
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="loading-text">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>
            {onComplete && timeLeft > 0
              ? `Connecting to Solana Network... ${timeLeft}s`
              : 'Connecting to Solana Network'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
