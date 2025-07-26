import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface TokenSearchProps {
  onTokenSelect: (token: Token) => void;
  placeholder: string;
  selectedToken?: Token;
}

const POPULAR_TOKENS: Token[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
  },
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRhwTLdMPkqhuBczetogeoK",
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    logoURI: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I"
  },
  {
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBtUk6goG7zcX3New",
    symbol: "WIF",
    name: "dogwifhat",
    decimals: 6,
    logoURI: "https://bafkreicrjgjei47pz6ue5d3mi5kgurjclqxfyqfhywu5w6fhmzpe6q5afm.ipfs.nftstorage.link"
  }
];

export default function TokenSearch({ onTokenSelect, placeholder, selectedToken }: TokenSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tokens, setTokens] = useState<Token[]>(POPULAR_TOKENS);
  const [loading, setLoading] = useState(false);

  const connection = new Connection('https://api.mainnet-beta.solana.com');

  useEffect(() => {
    if (searchTerm.length > 10 && searchTerm.length < 50) {
      searchTokenByAddress(searchTerm);
    } else {
      setTokens(POPULAR_TOKENS);
    }
  }, [searchTerm]);

  async function searchTokenByAddress(address: string) {
    try {
      setLoading(true);

      // Validate address format
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        setTokens(POPULAR_TOKENS);
        return;
      }

      const pubkey = new PublicKey(address);

      // Try to get account info to verify it exists
      const accountInfo = await connection.getAccountInfo(pubkey);
      if (accountInfo) {
        // Try to get token metadata from Jupiter API
        try {
          const response = await fetch(`https://token.jup.ag/token/${address}`);
          if (response.ok) {
            const tokenData = await response.json();
            const customToken: Token = {
              address: address,
              symbol: tokenData.symbol || `${address.slice(0, 4)}...${address.slice(-4)}`,
              name: tokenData.name || `Token ${address.slice(0, 8)}`,
              decimals: tokenData.decimals || 9,
              logoURI: tokenData.logoURI
            };
            setTokens([customToken, ...POPULAR_TOKENS]);
          } else {
            // Fallback if no metadata found
            const customToken: Token = {
              address: address,
              symbol: `${address.slice(0, 4)}...${address.slice(-4)}`,
              name: `Custom Token`,
              decimals: 9,
            };
            setTokens([customToken, ...POPULAR_TOKENS]);
          }
        } catch (metadataError) {
          // Fallback token
          const customToken: Token = {
            address: address,
            symbol: `${address.slice(0, 4)}...${address.slice(-4)}`,
            name: `Token ${address.slice(0, 8)}`,
            decimals: 9,
          };
          setTokens([customToken, ...POPULAR_TOKENS]);
        }
      } else {
        setTokens(POPULAR_TOKENS);
      }
    } catch (error) {
      console.log('Token search error:', error);
      setTokens(POPULAR_TOKENS);
    } finally {
      setLoading(false);
    }
  }

  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.address.includes(searchTerm)
  );

  return (
    <div className="token-search-container">
      <div 
        className="token-search-selected"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedToken ? (
          <div className="selected-token">
            {selectedToken.logoURI && (
              <img src={selectedToken.logoURI} alt={selectedToken.symbol} className="token-logo" />
            )}
            <span>{selectedToken.symbol}</span>
          </div>
        ) : (
          <span>{placeholder}</span>
        )}
        <span className="dropdown-arrow">▼</span>
      </div>
      
      {isOpen && (
        <div className="token-search-dropdown">
          <input
            className="token-search-input"
            type="text"
            placeholder="Search token or paste contract address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          
          <div className="token-list">
            {loading && (
              <div className="token-item">
                <span className="spinner" /> Searching...
              </div>
            )}
            
            {filteredTokens.map((token) => (
              <div
                key={token.address}
                className="token-item"
                onClick={() => {
                  onTokenSelect(token);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {token.logoURI && (
                  <img src={token.logoURI} alt={token.symbol} className="token-logo" />
                )}
                <div className="token-info">
                  <div className="token-symbol">{token.symbol}</div>
                  <div className="token-name">{token.name}</div>
                </div>
              </div>
            ))}
            
            {!loading && filteredTokens.length === 0 && (
              <div className="token-item">
                No tokens found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
