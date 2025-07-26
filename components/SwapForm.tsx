import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api';
import TokenSearch from './TokenSearch';
import WalletWrapper from './WalletWrapper';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

function SwapFormContent() {
  const { publicKey, wallet, signTransaction } = useWallet();
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

  const jupiterQuoteApi = createJupiterApiClient();
  const connection = new Connection(RPC_URL);

  // Fetch FROM token balance only
  useEffect(() => {
    async function fetchFromBalance() {
      if (!publicKey) {
        setFromBalance(0);
        return;
      }

      try {
        if (fromToken.address === "So11111111111111111111111111111111111111112") {
          const solBalance = await connection.getBalance(publicKey);
          setFromBalance(solBalance / Math.pow(10, 9));
        } else {
          try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
              mint: new PublicKey(fromToken.address)
            });
            if (tokenAccounts.value.length > 0) {
              const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
              setFromBalance(balance);
            } else {
              setFromBalance(0);
            }
          } catch (tokenError) {
            console.log('Token account not found or invalid:', fromToken.address);
            setFromBalance(0);
          }
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        setFromBalance(0);
      }
    }

    fetchFromBalance();
  }, [publicKey, fromToken]);

  // Real-time quote fetching with auto-refresh
  useEffect(() => {
    async function fetchQuote() {
      setQuote(null);
      setSwapStatus("");
      if (!fromToken.address || !toToken.address || !amount || Number(amount) <= 0 || fromToken.address === toToken.address) return;

      setQuoteLoading(true);
      try {
        const amountAtoms = Math.floor(Number(amount) * Math.pow(10, fromToken.decimals));

        // Use fetch directly for better error handling
        const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${fromToken.address}&outputMint=${toToken.address}&amount=${amountAtoms}&slippageBps=50`);

        if (!response.ok) {
          throw new Error(`Quote API error: ${response.status}`);
        }

        const quote = await response.json();
        setQuote(quote);
      } catch (e) {
        console.error('Quote error:', e);
        setQuote(null);
      }
      setQuoteLoading(false);
    }

    fetchQuote();

    // Auto-refresh quotes every 15 seconds (less frequent to avoid rate limits)
    const interval = setInterval(fetchQuote, 15000);
    return () => clearInterval(interval);
  }, [fromToken, toToken, amount]);

  async function handleSwap(e: React.FormEvent) {
    e.preventDefault();
    setSwapStatus("Preparing swap...");

    try {
      if (!quote || !publicKey || !wallet || !signTransaction) {
        return setSwapStatus("No route or wallet.");
      }

      if (!receiveAddress) {
        return setSwapStatus("Please enter a receive address.");
      }

      setSwapStatus("Building transaction...");

      // Get swap transaction
      const swapResult = await jupiterQuoteApi.swapPost({
        swapRequest: {
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true,
          destinationTokenAccount: receiveAddress !== publicKey.toString() ? receiveAddress : undefined,
        }
      });

      setSwapStatus("Please sign the transaction...");

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);

      setSwapStatus("Sending transaction...");

      // Execute the transaction
      const txid = await connection.sendTransaction(signedTransaction, {
        maxRetries: 3,
        skipPreflight: false,
      });

      setSwapStatus(`Swap submitted! Confirming... Tx: ${txid}`);

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(txid, 'confirmed');

      if (confirmation.value.err) {
        setSwapStatus("Transaction failed: " + confirmation.value.err);
      } else {
        setSwapStatus("✅ Swap successful! Tx: " + txid);
        // Reset form
        setAmount("");
      }

    } catch (e: any) {
      setSwapStatus("❌ Swap failed: " + (e?.message || e));
    }
  }

  return (
    <div className="swap-form card">
      <h2 className="swap-title">Token Swap</h2>

      <div className="swap-section">
        <div className="swap-label-row">
          <label className="swap-label">From Token</label>
          <span className="balance-display">Balance: {fromBalance.toFixed(6)} {fromToken.symbol}</span>
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
          <span className="balance-display">Balance: {toBalance.toFixed(6)} {toToken.symbol}</span>
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

      <div className="swap-section">
        <label className="swap-label">Receive Address (Optional)</label>
        <input
          className="swap-input"
          type="text"
          value={receiveAddress}
          onChange={e => setReceiveAddress(e.target.value)}
          placeholder="Leave empty to receive in your wallet"
        />
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
              <span>Platform fees:</span>
              <span>{quote.platformFee ? `${quote.platformFee.amount} ${quote.platformFee.mint}` : 'None'}</span>
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
