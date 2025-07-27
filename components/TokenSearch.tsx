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
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg"
  },
  {
    address: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    symbol: "JITO",
    name: "Jito",
    decimals: 9,
    logoURI: "https://storage.googleapis.com/token-list-swapkit/images/sol.jito-J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn.png"
  }
];

export default function TokenSearch({ onTokenSelect, placeholder, selectedToken }: TokenSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tokens, setTokens] = useState<Token[]>(POPULAR_TOKENS);
  const [loading, setLoading] = useState(false);

  const connection = new Connection('https://api.mainnet-beta.solana.com');

  useEffect(() => {
    // Enhanced search for Solana addresses (pump.fun tokens and others)
    if (searchTerm.length >= 32 && searchTerm.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(searchTerm)) {
      // Looks like a Solana address, search for it
      const timeoutId = setTimeout(() => {
        searchTokenByAddress(searchTerm);
      }, 300); // Reduced debounce for faster response

      return () => clearTimeout(timeoutId);
    } else if (searchTerm.length === 0) {
      // Reset to popular tokens when search is cleared
      setTokens(POPULAR_TOKENS);
    } else if (searchTerm.length >= 2) {
      // Search for tokens by symbol/name with minimum 2 characters
      const timeoutId = setTimeout(() => {
        searchTokensByName(searchTerm);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else if (searchTerm.length > 0) {
      // Filter popular tokens by search term
      const filtered = POPULAR_TOKENS.filter(token =>
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setTokens(filtered.length > 0 ? filtered : POPULAR_TOKENS);
    }
  }, [searchTerm]);

  async function searchTokensByName(name: string) {
    try {
      setLoading(true);
      console.log('Searching tokens by name:', name);

      let foundTokens: Token[] = [];

      // First filter popular tokens
      const filtered = POPULAR_TOKENS.filter(token =>
        token.symbol.toLowerCase().includes(name.toLowerCase()) ||
        token.name.toLowerCase().includes(name.toLowerCase())
      );
      foundTokens = [...filtered];

      // Search Jupiter token list for more tokens
      try {
        const response = await fetch('https://token.jup.ag/all');
        if (response.ok) {
          const allTokens = await response.json();
          const matchingTokens = allTokens
            .filter((token: any) =>
              (token.symbol?.toLowerCase().includes(name.toLowerCase()) ||
               token.name?.toLowerCase().includes(name.toLowerCase())) &&
              !foundTokens.find(existing => existing.address === token.address)
            )
            .slice(0, 20) // Limit results
            .map((token: any) => ({
              address: token.address,
              symbol: token.symbol || `${token.address.slice(0, 4)}...${token.address.slice(-4)}`,
              name: token.name || `Token ${token.address.slice(0, 8)}`,
              decimals: token.decimals || 9,
              logoURI: token.logoURI
            }));

          foundTokens = [...foundTokens, ...matchingTokens];
        }
      } catch (error) {
        console.log('Jupiter search error:', error);
      }

      setTokens(foundTokens.length > 0 ? foundTokens : POPULAR_TOKENS);
    } catch (error) {
      console.error('Token name search error:', error);
      setTokens(POPULAR_TOKENS);
    } finally {
      setLoading(false);
    }
  }

  async function searchTokenByAddress(address: string) {
    try {
      setLoading(true);

      // Validate address format (Solana address is base58 and 32-44 characters)
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        setTokens(POPULAR_TOKENS);
        return;
      }

      console.log('Searching for token:', address);

      let tokenFound = false;
      let customToken: Token | null = null;

      try {
        const pubkey = new PublicKey(address);

        // Check if account exists on Solana
        const accountInfo = await connection.getAccountInfo(pubkey);
        if (!accountInfo) {
          console.log('Token account does not exist');
          setTokens(POPULAR_TOKENS);
          return;
        }

        console.log('Token account exists');

        // Try multiple sources for token metadata

        // 1. Try Jupiter Token List API (best for pump.fun and new tokens)
        try {
          console.log('Trying Jupiter token list...');
          const jupiterResponse = await fetch(`https://token.jup.ag/token/${address}`);
          if (jupiterResponse.ok) {
            const tokenData = await jupiterResponse.json();
            customToken = {
              address: address,
              symbol: tokenData.symbol || `${address.slice(0, 4)}...${address.slice(-4)}`,
              name: tokenData.name || `Token ${address.slice(0, 8)}`,
              decimals: tokenData.decimals || 9,
              logoURI: tokenData.logoURI
            };
            tokenFound = true;
            console.log('Found token in Jupiter list:', customToken);
          }
        } catch (jupiterError) {
          console.log('Jupiter API error:', jupiterError);
        }

        // 1.5. Try Jupiter all tokens endpoint for comprehensive search
        if (!tokenFound) {
          try {
            console.log('Trying Jupiter all tokens...');
            const allTokensResponse = await fetch('https://token.jup.ag/all');
            if (allTokensResponse.ok) {
              const allTokens = await allTokensResponse.json();
              const foundToken = allTokens.find((token: any) => token.address === address);
              if (foundToken) {
                customToken = {
                  address: address,
                  symbol: foundToken.symbol || `${address.slice(0, 4)}...${address.slice(-4)}`,
                  name: foundToken.name || `Token ${address.slice(0, 8)}`,
                  decimals: foundToken.decimals || 9,
                  logoURI: foundToken.logoURI
                };
                tokenFound = true;
                console.log('Found token in Jupiter all tokens:', customToken);
              }
            }
          } catch (allTokensError) {
            console.log('Jupiter all tokens error:', allTokensError);
          }
        }

        // 1.6. Try pump.fun API for pump.fun tokens
        if (!tokenFound) {
          try {
            console.log('Trying pump.fun API...');
            const pumpResponse = await fetch(`https://frontend-api.pump.fun/coins/${address}`);
            if (pumpResponse.ok) {
              const pumpData = await pumpResponse.json();
              if (pumpData && pumpData.name) {
                customToken = {
                  address: address,
                  symbol: pumpData.symbol || `${address.slice(0, 4)}...${address.slice(-4)}`,
                  name: pumpData.name || `Pump Token ${address.slice(0, 8)}`,
                  decimals: 6, // Most pump.fun tokens use 6 decimals
                  logoURI: pumpData.image_uri
                };
                tokenFound = true;
                console.log('Found token in pump.fun:', customToken);
              }
            }
          } catch (pumpError) {
            console.log('Pump.fun API error:', pumpError);
          }
        }

        // 1.7. Try DexScreener API for additional token data
        if (!tokenFound) {
          try {
            console.log('Trying DexScreener API...');
            const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
            if (dexResponse.ok) {
              const dexData = await dexResponse.json();
              if (dexData && dexData.pairs && dexData.pairs.length > 0) {
                const pair = dexData.pairs[0];
                const baseToken = pair.baseToken.address.toLowerCase() === address.toLowerCase() ? pair.baseToken : pair.quoteToken;
                customToken = {
                  address: address,
                  symbol: baseToken.symbol || `${address.slice(0, 4)}...${address.slice(-4)}`,
                  name: baseToken.name || `DexToken ${address.slice(0, 8)}`,
                  decimals: 9, // Default for most Solana tokens
                  logoURI: pair.info?.imageUrl
                };
                tokenFound = true;
                console.log('Found token in DexScreener:', customToken);
              }
            }
          } catch (dexError) {
            console.log('DexScreener API error:', dexError);
          }
        }

        // 2. Try Solana Token List (includes many pump.fun tokens)
        if (!tokenFound) {
          try {
            console.log('Trying Solana token list...');
            const solanaListResponse = await fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json');
            if (solanaListResponse.ok) {
              const tokenList = await solanaListResponse.json();
              const foundToken = tokenList.tokens.find((token: any) => token.address === address);
              if (foundToken) {
                customToken = {
                  address: address,
                  symbol: foundToken.symbol,
                  name: foundToken.name,
                  decimals: foundToken.decimals,
                  logoURI: foundToken.logoURI
                };
                tokenFound = true;
                console.log('Found token in Solana list:', customToken);
              }
            }
          } catch (solanaListError) {
            console.log('Solana token list error:', solanaListError);
          }
        }

        // 3. Try to get token metadata from the account directly
        if (!tokenFound) {
          try {
            console.log('Trying to parse token metadata from account...');
            // Try to get token supply and decimals from the mint account
            const tokenSupply = await connection.getTokenSupply(pubkey);
            if (tokenSupply && tokenSupply.value) {
              customToken = {
                address: address,
                symbol: `${address.slice(0, 6)}...${address.slice(-4)}`,
                name: `Custom Token`,
                decimals: tokenSupply.value.decimals || 9,
              };
              tokenFound = true;
              console.log('Created token from mint info:', customToken);
            }
          } catch (mintError) {
            console.log('Mint info error:', mintError);
          }
        }

        // 4. Fallback: create basic token info
        if (!tokenFound) {
          console.log('Creating fallback token info...');
          customToken = {
            address: address,
            symbol: `${address.slice(0, 4)}...${address.slice(-4)}`,
            name: `Token ${address.slice(0, 8)}`,
            decimals: 9,
          };
        }

        if (customToken) {
          setTokens([customToken, ...POPULAR_TOKENS]);
          console.log('Token search successful');
        } else {
          setTokens(POPULAR_TOKENS);
        }

      } catch (pubkeyError) {
        console.log('Invalid public key:', pubkeyError);
        setTokens(POPULAR_TOKENS);
      }

    } catch (error) {
      console.error('Token search error:', error);
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
            placeholder="Search by name/symbol or paste contract address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="search-hint">
            💡 Supports all Solana tokens including pump.fun memes
          </div>
          
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
