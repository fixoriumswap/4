import React, { useState, useEffect } from 'react';
import { useWalletContext } from './WalletContext';
import { Connection, PublicKey, VersionedTransaction, Keypair } from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: number;
}

const POPULAR_TOKENS: Token[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6
  },
  {
    address: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    symbol: "mSOL",
    name: "Marinade SOL",
    decimals: 9
  },
  {
    address: "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
    symbol: "bSOL",
    name: "BlazeStake SOL",
    decimals: 9
  }
];

export default function TokenSwap() {
  const { publicKey, keypair, isConnected: connected } = useWalletContext();
  const [fromToken, setFromToken] = useState<Token>(POPULAR_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(POPULAR_TOKENS[1]);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState('');
  const [fromBalance, setFromBalance] = useState<number>(0);
  const [toBalance, setToBalance] = useState<number>(0);
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  const connection = new Connection(RPC_URL);

  // Fetch token balances
  useEffect(() => {
    if (connected && publicKey) {
      fetchTokenBalance(fromToken, setFromBalance);
      fetchTokenBalance(toToken, setToBalance);
    }
  }, [connected, publicKey, fromToken, toToken]);

  // Fetch quotes
  useEffect(() => {
    fetchQuote();
    
    // Auto-refresh quotes every 15 seconds
    const interval = setInterval(fetchQuote, 15000);
    return () => clearInterval(interval);
  }, [fromToken, toToken, amount, slippage]);

  const fetchTokenBalance = async (token: Token, setBalance: (balance: number) => void) => {
    if (!publicKey) return;

    try {
      if (token.address === "So11111111111111111111111111111111111111112") {
        // SOL balance
        const solBalance = await connection.getBalance(publicKey, 'finalized');
        setBalance(solBalance / Math.pow(10, 9));
      } else {
        // SPL Token balance
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: new PublicKey(token.address) },
          'finalized'
        );

        if (tokenAccounts.value.length > 0) {
          const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
          setBalance(balance);
        } else {
          setBalance(0);
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
    }
  };

  const fetchQuote = async () => {
    if (!fromToken.address || !toToken.address || !amount || Number(amount) <= 0 || fromToken.address === toToken.address) {
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    setSwapStatus('');

    try {
      const amountAtoms = Math.floor(Number(amount) * Math.pow(10, fromToken.decimals));
      const slippageBps = Math.floor(slippage * 100);

      const queryParams = new URLSearchParams({
        inputMint: fromToken.address,
        outputMint: toToken.address,
        amount: amountAtoms.toString(),
        slippageBps: slippageBps.toString(),
        onlyDirectRoutes: 'false',
        asLegacyTransaction: 'false'
      });

      const response = await fetch(`https://quote-api.jup.ag/v6/quote?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Quote API error: ${response.status}`);
      }

      const quoteData = await response.json();
      
      if (!quoteData || !quoteData.outAmount) {
        throw new Error('Invalid quote response');
      }

      setQuote(quoteData);
    } catch (error: any) {
      console.error('Quote error:', error);
      setQuote(null);
      setSwapStatus(`Unable to get quote: ${error.message}`);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote || !publicKey || !signTransaction) {
      setSwapStatus('Missing requirements for swap');
      return;
    }

    setSwapStatus('Preparing swap...');

    try {
      // Get swap transaction
      const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto'
        })
      });

      if (!swapResponse.ok) {
        throw new Error(`Swap API error: ${swapResponse.status}`);
      }

      const swapResult = await swapResponse.json();

      setSwapStatus('Please confirm transaction in your wallet...');

      // Deserialize and sign transaction
      const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      if (!keypair) {
        throw new Error('Keypair not available for signing');
      }

      transaction.sign([keypair]);
      const signedTransaction = transaction;

      setSwapStatus('Submitting transaction...');

      // Send transaction
      const txid = await connection.sendTransaction(signedTransaction, {
        maxRetries: 3,
        skipPreflight: false,
      });

      setSwapStatus(`Transaction submitted! Confirming... ${txid}`);

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(txid, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      setSwapStatus(`✅ Swap successful! Transaction: ${txid}`);
      
      // Reset form and refresh balances
      setAmount('');
      setTimeout(() => {
        fetchTokenBalance(fromToken, setFromBalance);
        fetchTokenBalance(toToken, setToBalance);
      }, 2000);

    } catch (error: any) {
      console.error('Swap error:', error);
      setSwapStatus(`❌ Swap failed: ${error.message || 'Unknown error'}`);
    }
  };

  const swapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setAmount('');
  };

  const setMaxAmount = () => {
    setAmount(fromBalance.toString());
  };

  const formatNumber = (value: number, decimals: number = 6) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const TokenSelector = ({ 
    token, 
    onSelect, 
    label, 
    balance 
  }: { 
    token: Token; 
    onSelect: (token: Token) => void; 
    label: string;
    balance: number;
  }) => (
    <div className="token-selector-container">
      <div className="token-selector-header">
        <label className="form-label">{label}</label>
        <span className="balance-display">
          Balance: {formatNumber(balance)} {token.symbol}
        </span>
      </div>
      <div className="token-selector">
        <div className="selected-token">
          <div className="token-icon">
            {token.symbol.charAt(0)}
          </div>
          <div className="token-info">
            <div className="token-symbol">{token.symbol}</div>
            <div className="token-name">{token.name}</div>
          </div>
          <div className="dropdown-arrow">▼</div>
        </div>
        <div className="token-dropdown">
          {POPULAR_TOKENS.map((t) => (
            <button
              key={t.address}
              className={`token-option ${t.address === token.address ? 'selected' : ''}`}
              onClick={() => onSelect(t)}
            >
              <div className="token-icon">{t.symbol.charAt(0)}</div>
              <div className="token-info">
                <div className="token-symbol">{t.symbol}</div>
                <div className="token-name">{t.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="token-swap">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Token Swap</h2>
            <p className="card-subtitle">Exchange tokens at the best rates</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Settings
          </button>
        </div>

        {showSettings && (
          <div className="swap-settings">
            <h4>Swap Settings</h4>
            <div className="form-group">
              <label className="form-label">Slippage Tolerance</label>
              <div className="slippage-options">
                {[0.1, 0.5, 1.0].map((value) => (
                  <button
                    key={value}
                    className={`slippage-btn ${slippage === value ? 'active' : ''}`}
                    onClick={() => setSlippage(value)}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="number"
                  className="slippage-input"
                  value={slippage}
                  onChange={(e) => setSlippage(Number(e.target.value))}
                  min="0.1"
                  max="50"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        )}

        <div className="swap-form">
          {/* From Token */}
          <TokenSelector
            token={fromToken}
            onSelect={setFromToken}
            label="From"
            balance={fromBalance}
          />

          {/* Amount Input */}
          <div className="form-group">
            <div className="amount-input-container">
              <input
                type="number"
                className="amount-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
              />
              <button className="max-button" onClick={setMaxAmount}>
                MAX
              </button>
            </div>
          </div>

          {/* Swap Button */}
          <div className="swap-middle">
            <button className="swap-direction-btn" onClick={swapTokens}>
              🔄
            </button>
          </div>

          {/* To Token */}
          <TokenSelector
            token={toToken}
            onSelect={setToToken}
            label="To"
            balance={toBalance}
          />

          {/* Quote Section */}
          <div className="quote-section">
            {quoteLoading ? (
              <div className="quote-loading">
                <span className="spinner" />
                <span>Finding best route...</span>
              </div>
            ) : quote ? (
              <div className="quote-details">
                <div className="quote-row">
                  <span>You pay:</span>
                  <span><strong>{amount} {fromToken.symbol}</strong></span>
                </div>
                <div className="quote-row">
                  <span>You receive:</span>
                  <span>
                    <strong>
                      {formatNumber(
                        parseInt(quote.outAmount) / Math.pow(10, toToken.decimals)
                      )} {toToken.symbol}
                    </strong>
                  </span>
                </div>
                <div className="quote-row small">
                  <span>Rate:</span>
                  <span>
                    1 {fromToken.symbol} = {formatNumber(
                      (parseInt(quote.outAmount) / Math.pow(10, toToken.decimals)) / Number(amount)
                    )} {toToken.symbol}
                  </span>
                </div>
                <div className="quote-row small">
                  <span>Price impact:</span>
                  <span>
                    {quote.priceImpactPct ? 
                      `${(parseFloat(quote.priceImpactPct) * 100).toFixed(3)}%` : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="quote-row small">
                  <span>Slippage:</span>
                  <span>{slippage}%</span>
                </div>
              </div>
            ) : amount && fromToken.address !== toToken.address ? (
              <div className="no-quote">
                <span>❌ No route found</span>
              </div>
            ) : (
              <div className="no-quote">
                <span>Enter amount to see quote</span>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <button
            className="btn btn-primary btn-lg w-full"
            onClick={handleSwap}
            disabled={!connected || !quote || quoteLoading || !amount}
          >
            {!connected ? 'Connect Wallet' :
             quoteLoading ? 'Loading...' :
             !quote ? 'Enter Amount' :
             'Swap Tokens'}
          </button>

          {/* Status */}
          {swapStatus && (
            <div className={`swap-status ${
              swapStatus.includes('✅') ? 'success' : 
              swapStatus.includes('❌') ? 'error' : 'info'
            }`}>
              {swapStatus}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .token-swap {
          max-width: 500px;
          margin: 0 auto;
        }

        .swap-settings {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .swap-settings h4 {
          margin: 0 0 16px 0;
          color: #e2e8f0;
          font-size: 16px;
        }

        .slippage-options {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .slippage-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .slippage-btn.active {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-color: transparent;
          color: #fff;
        }

        .slippage-input {
          width: 80px;
          padding: 8px 12px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
        }

        .swap-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .token-selector-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .token-selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .balance-display {
          font-size: 12px;
          color: #94a3b8;
        }

        .token-selector {
          position: relative;
        }

        .selected-token {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(15, 23, 42, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .selected-token:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .token-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #fff;
          font-size: 16px;
        }

        .token-info {
          flex: 1;
        }

        .token-symbol {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          margin-bottom: 2px;
        }

        .token-name {
          font-size: 12px;
          color: #94a3b8;
        }

        .dropdown-arrow {
          color: #94a3b8;
          font-size: 12px;
        }

        .token-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(30, 35, 52, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          z-index: 10;
          margin-top: 4px;
          max-height: 300px;
          overflow-y: auto;
          display: none;
        }

        .token-selector:hover .token-dropdown {
          display: block;
        }

        .token-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .token-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .token-option.selected {
          background: rgba(59, 130, 246, 0.1);
        }

        .token-option:last-child {
          border-bottom: none;
        }

        .amount-input-container {
          position: relative;
        }

        .amount-input {
          width: 100%;
          padding: 20px 80px 20px 20px;
          background: rgba(15, 23, 42, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 24px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .amount-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .amount-input::placeholder {
          color: #64748b;
        }

        .max-button {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .max-button:hover {
          transform: translateY(-50%) scale(1.05);
        }

        .swap-middle {
          display: flex;
          justify-content: center;
          margin: -8px 0;
          position: relative;
          z-index: 1;
        }

        .swap-direction-btn {
          width: 48px;
          height: 48px;
          background: rgba(30, 35, 52, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          color: #94a3b8;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .swap-direction-btn:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: #3b82f6;
          color: #3b82f6;
          transform: rotate(180deg);
        }

        .quote-section {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .quote-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #94a3b8;
          padding: 20px;
        }

        .quote-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .quote-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .quote-row.small {
          font-size: 12px;
          color: #94a3b8;
        }

        .no-quote {
          text-align: center;
          color: #94a3b8;
          padding: 20px;
        }

        .swap-status {
          padding: 16px;
          border-radius: 12px;
          font-size: 14px;
          word-break: break-all;
          text-align: center;
        }

        .swap-status.success {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .swap-status.error {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .swap-status.info {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        @media (max-width: 768px) {
          .slippage-options {
            flex-wrap: wrap;
          }

          .amount-input {
            font-size: 20px;
            padding: 16px 70px 16px 16px;
          }

          .max-button {
            right: 12px;
            padding: 6px 12px;
          }

          .quote-row {
            font-size: 13px;
          }

          .quote-row.small {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
