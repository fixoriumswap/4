import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, VersionedTransaction, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api';
import TokenSearch from './TokenSearch';
import WalletWrapper from './WalletWrapper';

// Platform fee configuration
const PLATFORM_FEE_AMOUNT = 0.0005; // 0.0005 SOL
const PLATFORM_FEE_ADDRESS = 'FNVD1wied3e8WMuWs34KSamrCpughCMTjoXUE1ZXa6wM';

const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

function SwapFormContent() {
  const { publicKey, wallet, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [fromToken, setFromToken] = useState<Token>({
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9
  });
  const [toToken, setToToken] = useState<Token>({
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6
  });
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState("");
  const [fromBalance, setFromBalance] = useState<number>(0);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const jupiterQuoteApi = createJupiterApiClient();

  // Validate if tokens are supported by Jupiter
  const validateTokens = async (fromAddr: string, toAddr: string) => {
    try {
      const response = await fetch('https://token.jup.ag/strict');
      if (response.ok) {
        const supportedTokens = await response.json();
        const fromSupported = supportedTokens.some((token: any) => token.address === fromAddr);
        const toSupported = supportedTokens.some((token: any) => token.address === toAddr);

        if (!fromSupported) {
          console.warn(`From token ${fromToken.symbol} (${fromAddr}) may not be supported by Jupiter`);
        }
        if (!toSupported) {
          console.warn(`To token ${toToken.symbol} (${toAddr}) may not be supported by Jupiter`);
        }

        return { fromSupported, toSupported };
      }
    } catch (error) {
      console.log('Token validation failed:', error);
    }
    return { fromSupported: true, toSupported: true }; // Assume supported if validation fails
  };

  // Listen for token selection from trending tokens
  useEffect(() => {
    const handleTokenSelection = (event: CustomEvent) => {
      const { fromToken: newFromToken, toToken: newToToken } = event.detail;
      if (newFromToken) setFromToken(newFromToken);
      if (newToToken) setToToken(newToToken);
      setAmount(''); // Reset amount
    };

    window.addEventListener('tokenSelected', handleTokenSelection as EventListener);

    // Check localStorage for any pending token selection
    const savedSwapData = localStorage.getItem('swapData');
    if (savedSwapData) {
      try {
        const { fromToken: newFromToken, toToken: newToToken } = JSON.parse(savedSwapData);
        if (newFromToken) setFromToken(newFromToken);
        if (newToToken) setToToken(newToToken);
        localStorage.removeItem('swapData'); // Clear after use
      } catch (error) {
        console.error('Error parsing saved swap data:', error);
      }
    }

    return () => {
      window.removeEventListener('tokenSelected', handleTokenSelection as EventListener);
    };
  }, []);

  // Fetch FROM token balance with real-time updates and robust error handling
  useEffect(() => {
    async function fetchFromBalance() {
      if (!publicKey || !fromToken.address) {
        setFromBalance(0);
        setBalanceError(null);
        return;
      }

      try {
        console.log('Fetching balance for token:', fromToken.symbol, fromToken.address);
        setBalanceError(null);

        let balanceFetched = false;
        let lastError: any = null;

        if (fromToken.address === "So11111111111111111111111111111111111111112") {
          // SOL balance - try multiple endpoints

          // Try wallet adapter connection first
          try {
            const solBalance = await connection.getBalance(publicKey, 'confirmed');
            const solAmount = solBalance / Math.pow(10, 9);
            console.log('SOL Balance (wallet connection):', solAmount);
            setFromBalance(solAmount);
            balanceFetched = true;
          } catch (walletConnError) {
            console.log('Wallet connection failed for SOL balance:', walletConnError);
            lastError = walletConnError;
          }

          // Try fallback RPC endpoints if needed
          if (!balanceFetched) {
            for (const rpcUrl of RPC_ENDPOINTS) {
              try {
                const fallbackConnection = new Connection(rpcUrl, {
                  commitment: 'confirmed',
                  confirmTransactionInitialTimeout: 8000,
                });
                const solBalance = await fallbackConnection.getBalance(publicKey, 'confirmed');
                const solAmount = solBalance / Math.pow(10, 9);
                console.log(`SOL Balance (${rpcUrl}):`, solAmount);
                setFromBalance(solAmount);
                balanceFetched = true;
                break;
              } catch (rpcError) {
                console.log(`RPC ${rpcUrl} failed for SOL:`, rpcError);
                lastError = rpcError;
              }
            }
          }
        } else {
          // SPL Token balance

          // Try wallet adapter connection first
          try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
              mint: new PublicKey(fromToken.address)
            }, 'confirmed');

            if (tokenAccounts.value.length > 0) {
              const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
              console.log(`${fromToken.symbol} Balance (wallet connection):`, balance);
              setFromBalance(balance);
              balanceFetched = true;
            } else {
              console.log('No token account found for:', fromToken.symbol);
              setFromBalance(0);
              balanceFetched = true;
            }
          } catch (tokenError) {
            console.log('Wallet connection failed for token balance:', tokenError);
            lastError = tokenError;
          }

          // Try fallback RPC endpoints if needed
          if (!balanceFetched) {
            for (const rpcUrl of RPC_ENDPOINTS) {
              try {
                const fallbackConnection = new Connection(rpcUrl, {
                  commitment: 'confirmed',
                  confirmTransactionInitialTimeout: 8000,
                });
                const tokenAccounts = await fallbackConnection.getParsedTokenAccountsByOwner(publicKey, {
                  mint: new PublicKey(fromToken.address)
                }, 'confirmed');

                if (tokenAccounts.value.length > 0) {
                  const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
                  console.log(`${fromToken.symbol} Balance (${rpcUrl}):`, balance);
                  setFromBalance(balance);
                  balanceFetched = true;
                  break;
                } else {
                  console.log(`No token account found on ${rpcUrl}`);
                  setFromBalance(0);
                  balanceFetched = true;
                  break;
                }
              } catch (rpcError) {
                console.log(`RPC ${rpcUrl} failed for token:`, rpcError);
                lastError = rpcError;
              }
            }
          }
        }

        if (!balanceFetched) {
          throw lastError || new Error('All balance fetch attempts failed');
        }

      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalanceError(`Failed to fetch ${fromToken.symbol} balance`);
        // Don't reset balance to 0 on error, keep last known balance
      }
    }

    if (publicKey && fromToken.address) {
      fetchFromBalance();

      // Real-time balance updates with adaptive interval
      const interval = setInterval(fetchFromBalance, balanceError ? 8000 : 4000);
      return () => clearInterval(interval);
    }
  }, [publicKey, fromToken, connection]);

  // Real-time quote fetching with auto-refresh
  useEffect(() => {
    async function fetchQuote() {
      setQuote(null);
      setSwapStatus("");

      if (!fromToken.address || !toToken.address || !amount || Number(amount) <= 0 || fromToken.address === toToken.address) {
        return;
      }

      setQuoteLoading(true);

      try {
        const amountAtoms = Math.floor(Number(amount) * Math.pow(10, fromToken.decimals));

        console.log('Fetching quote for:', {
          from: fromToken.symbol,
          to: toToken.symbol,
          amount: amountAtoms,
          fromMint: fromToken.address,
          toMint: toToken.address
        });

        // Validate tokens first
        const { fromSupported, toSupported } = await validateTokens(fromToken.address, toToken.address);

        if (!fromSupported || !toSupported) {
          const unsupportedToken = !fromSupported ? fromToken.symbol : toToken.symbol;
          setSwapStatus(`⚠️ ${unsupportedToken} may not be available for trading. Try a different token.`);
        }

        // Enhanced Jupiter API call with better error handling for token compatibility
        const queryParams = new URLSearchParams({
          inputMint: fromToken.address,
          outputMint: toToken.address,
          amount: amountAtoms.toString(),
          slippageBps: '100', // Increased slippage for better compatibility
          onlyDirectRoutes: 'false',
          asLegacyTransaction: 'false',
          maxAccounts: '64'
        });

        const response = await fetch(`https://quote-api.jup.ag/v6/quote?${queryParams}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log('Quote response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Quote API error response:', errorText);

          // Parse error for better user feedback
          let userFriendlyError = 'Unable to find route';
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.includes('not tradable')) {
              userFriendlyError = `${fromToken.symbol} or ${toToken.symbol} is not available for trading. Please try different tokens.`;
            } else if (errorData.error?.includes('insufficient liquidity')) {
              userFriendlyError = 'Insufficient liquidity for this trade. Try a smaller amount or different tokens.';
            } else if (errorData.error?.includes('amount too small')) {
              userFriendlyError = 'Trade amount too small. Please increase the amount.';
            }
          } catch (parseError) {
            // Use original error if parsing fails
          }

          throw new Error(userFriendlyError);
        }

        const quote = await response.json();
        console.log('Quote received:', quote);

        // Validate quote response
        if (!quote || !quote.outAmount) {
          throw new Error('Invalid quote response');
        }

        setQuote(quote);
      } catch (e) {
        console.error('Quote error:', e);
        setQuote(null);
        setSwapStatus(`Quote error: ${e.message || 'Unable to find route'}`);
      } finally {
        setQuoteLoading(false);
      }
    }

    fetchQuote();

    // Auto-refresh quotes every 20 seconds (more conservative)
    const interval = setInterval(fetchQuote, 20000);
    return () => clearInterval(interval);
  }, [fromToken, toToken, amount]);

  // Function to create platform fee transaction
  const createPlatformFeeTransaction = async () => {
    try {
      const platformFeeAddress = new PublicKey(PLATFORM_FEE_ADDRESS);
      const lamports = Math.floor(PLATFORM_FEE_AMOUNT * LAMPORTS_PER_SOL);

      const feeTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: platformFeeAddress,
          lamports,
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      feeTransaction.recentBlockhash = blockhash;
      feeTransaction.feePayer = publicKey!;

      return feeTransaction;
    } catch (error) {
      console.error('Error creating platform fee transaction:', error);
      throw error;
    }
  };

  async function handleSwap() {
    setSwapStatus("Preparing swap...");

    try {
      if (!quote || !publicKey || !signTransaction) {
        return setSwapStatus("No route or wallet.");
      }

      // Check if user has enough SOL for swap + platform fee
      const currentBalance = fromBalance;
      const swapAmount = parseFloat(amount);
      const requiredBalance = fromToken.symbol === 'SOL' ? swapAmount + PLATFORM_FEE_AMOUNT + 0.001 : PLATFORM_FEE_AMOUNT + 0.001; // +0.001 for transaction fees

      if (fromToken.symbol === 'SOL' && currentBalance < requiredBalance) {
        setSwapStatus(`❌ Insufficient SOL. Need ${requiredBalance.toFixed(4)} SOL (including platform fee and transaction fees)`);
        return;
      } else if (fromToken.symbol !== 'SOL' && currentBalance < PLATFORM_FEE_AMOUNT + 0.001) {
        setSwapStatus(`❌ Insufficient SOL for fees. Need at least ${(PLATFORM_FEE_AMOUNT + 0.001).toFixed(4)} SOL for platform fee and transaction fees`);
        return;
      }

      setSwapStatus("Building transactions...");

      // Create platform fee transaction first
      const feeTransaction = await createPlatformFeeTransaction();

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
        })
      });

      if (!swapResponse.ok) {
        throw new Error(`Swap API error: ${swapResponse.status}`);
      }

      const swapResult = await swapResponse.json();

      setSwapStatus("Please sign the transactions...");

      // Sign platform fee transaction
      const signedFeeTransaction = await signTransaction(feeTransaction);

      // Deserialize and sign the swap transaction
      const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
      const swapTransaction = VersionedTransaction.deserialize(swapTransactionBuf);
      const signedSwapTransaction = await signTransaction(swapTransaction);

      setSwapStatus("Sending transactions...");

      // Send platform fee transaction first
      const feeTxid = await connection.sendTransaction(signedFeeTransaction, {
        maxRetries: 3,
        skipPreflight: false,
      });

      console.log('Platform fee transaction sent:', feeTxid);

      // Wait for fee transaction confirmation before proceeding with swap
      await connection.confirmTransaction(feeTxid, 'confirmed');

      // Send swap transaction
      const swapTxid = await connection.sendTransaction(signedSwapTransaction, {
        maxRetries: 3,
        skipPreflight: false,
      });

      setSwapStatus(`Swap submitted! Confirming... Tx: ${swapTxid}`);

      // Confirm swap transaction
      const confirmation = await connection.confirmTransaction(swapTxid, 'confirmed');

      if (confirmation.value.err) {
        setSwapStatus("Transaction failed: " + confirmation.value.err);
      } else {
        setSwapStatus("✅ Swap successful! Tx: " + swapTxid);
        // Reset form
        setAmount("");
      }

    } catch (e: any) {
      console.error('Swap error:', e);
      setSwapStatus("❌ Swap failed: " + (e?.message || e));
    }
  }

  return (
    <div className="swap-form card">
      <div className="swap-section">
        <div className="swap-label-row">
          <label className="swap-label">From Token</label>
          <span className="balance-display">
            Balance: {fromBalance.toFixed(6)} {fromToken.symbol}
            {balanceError && <span className="balance-error-indicator" title={balanceError}>⚠️</span>}
          </span>
        </div>
        <TokenSearch
          onTokenSelect={setFromToken}
          placeholder="Select token to swap from"
          selectedToken={fromToken}
        />
      </div>

      <div className="swap-section">
        <div className="swap-label-row">
          <label className="swap-label">To Token</label>
        </div>
        <TokenSearch
          onTokenSelect={setToToken}
          placeholder="Select token to receive"
          selectedToken={toToken}
        />
      </div>

      <div className="swap-section">
        <label className="swap-label">Amount to Swap</label>
        <div className="amount-input-container">
          <input
            className="swap-input"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <button
            type="button"
            className="max-btn"
            onClick={() => setAmount(fromBalance.toString())}
          >
            MAX
          </button>
        </div>
      </div>

      <div className="quote-section">
        {quoteLoading ? (
          <div className="loading-quote">
            <span className="spinner"/> Fetching best quote...
          </div>
        ) : quote ? (
          <div className="quote-details">
            <div className="quote-row">
              <span>You pay:</span>
              <span><b>{amount} {fromToken.symbol}</b></span>
            </div>
            <div className="quote-row">
              <span>You receive:</span>
              <span><b>{(parseInt(quote.outAmount)/Math.pow(10,toToken.decimals)).toFixed(6)} {toToken.symbol}</b></span>
            </div>
            <div className="quote-row">
              <span>Price impact:</span>
              <span>{quote.priceImpactPct ? `${(parseFloat(quote.priceImpactPct) * 100).toFixed(2)}%` : 'N/A'}</span>
            </div>
            <div className="quote-row small">
              <span>Platform fee:</span>
              <span className="platform-fee">{PLATFORM_FEE_AMOUNT} SOL</span>
            </div>
            <div className="quote-row small">
              <span>Network fee:</span>
              <span>~0.001 SOL</span>
            </div>
            <div className="quote-row total-cost">
              <span><b>Total cost:</b></span>
              <span><b>{(parseFloat(amount) + PLATFORM_FEE_AMOUNT + 0.001).toFixed(6)} SOL</b></span>
            </div>
          </div>
        ) : amount && fromToken.address !== toToken.address ? (
          <div className="no-quote">
            <span style={{color:"#f73e3e"}}>No route found</span>
          </div>
        ) : null}
      </div>

      <button
        className="swap-btn"
        type="button"
        onClick={handleSwap}
        disabled={!quote || !publicKey || quoteLoading}
      >
        {!publicKey ? 'Connect Wallet' :
         quoteLoading ? 'Finding Route...' :
         quote ? 'Swap Tokens' : 'Enter Amount'}
      </button>

      {swapStatus && (
        <div className="swap-status">{swapStatus}</div>
      )}
    </div>
  );
}

export default function SwapForm() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="swap-form card">
        <h2 className="swap-title">Token Swap</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <span className="spinner" /> Loading...
        </div>
      </div>
    );
  }

  return <SwapFormContent />;
}
