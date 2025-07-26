import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, VersionedTransaction, SystemProgram, TransactionMessage, ComputeBudgetProgram } from '@solana/web3.js';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const JUPITER_API_URL = 'https://api.jup.ag/swap/v6';

const TOKEN_DECIMALS = {
  "So11111111111111111111111111111111111111112": 9, // SOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 6, // USDC
  "DezXAZ8z7PnrnRJjz3wXBoRhwTLdMPkqhuBczetogeoK": 5, // BONK
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBtUk6goG7zcX3New": 6, // WIF
};
const TOKEN_SYMBOLS = {
  "So11111111111111111111111111111111111111112": "SOL",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
  "DezXAZ8z7PnrnRJjz3wXBoRhwTLdMPkqhuBczetogeoK": "BONK",
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBtUk6goG7zcX3New": "WIF",
};

interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: any;
  priceImpactPct: string;
  routePlan: any[];
}

export default function SwapForm() {
  const { publicKey, signTransaction, connected } = useWallet();
  const [fromMint, setFromMint] = useState("So11111111111111111111111111111111111111112");
  const [toMint, setToMint] = useState("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchQuote() {
      setQuote(null);
      setSwapStatus("");
      setError("");
      if (!fromMint || !toMint || !amount || Number(amount) <= 0 || fromMint === toMint) return;
      setQuoteLoading(true);
      try {
        const amountLamports = Math.floor(Number(amount) * Math.pow(10, TOKEN_DECIMALS[fromMint]));
        const slippageBps = Math.floor(slippage * 100);
        const params = new URLSearchParams({
          inputMint: fromMint,
          outputMint: toMint,
          amount: amountLamports.toString(),
          slippageBps: slippageBps.toString()
        });

        const response = await fetch(`${JUPITER_API_URL}/quote?${params}`);
        if (response.ok) {
          const quoteData = await response.json();
          if (quoteData.error) {
            setError(quoteData.error);
            setQuote(null);
          } else {
            setQuote(quoteData);
          }
        } else {
          const errorData = await response.json().catch(() => null);
          setError(errorData?.error || 'Failed to get quote');
          setQuote(null);
        }
      } catch (e: any) {
        setError('Network error: ' + (e?.message || 'Unknown error'));
        setQuote(null);
      }
      setQuoteLoading(false);
    }
    fetchQuote();
  }, [fromMint, toMint, amount, slippage]);

  async function handleSwap(e: React.FormEvent) {
    e.preventDefault();
    setSwapStatus("Preparing swap...");
    setError("");

    try {
      if (!connected) {
        setError("Please connect your Phantom wallet first");
        return;
      }

      if (!quote || !publicKey || !signTransaction) {
        setError("No route available or wallet not connected");
        return;
      }

      const connection = new Connection(RPC_URL);
      const serviceFeeLamports = 0.001 * 1e9; // 0.001 SOL in lamports
      const feeWallet = new PublicKey("FNVD1wied3e8WMuWs34KSamrCpughCMTjoXUE1ZXa6wM");

      // Check if user has enough SOL for the fee + minimum rent
      const balance = await connection.getBalance(publicKey);
      const minRequiredBalance = serviceFeeLamports + 5000; // 5000 lamports for rent
      if (balance < minRequiredBalance) {
        setError(`Insufficient SOL balance. Need at least ${(minRequiredBalance / 1e9).toFixed(4)} SOL`);
        return;
      }

      setSwapStatus("Getting transaction...");
      const response = await fetch(`${JUPITER_API_URL}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true,
          feeAccount: feeWallet.toString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to get transaction');
      }

      const { swapTransaction } = await response.json();
      if (!swapTransaction) {
        throw new Error('No transaction received from Jupiter');
      }

      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Get latest blockhash for fee transaction
      const { blockhash } = await connection.getLatestBlockhash();

      // Create fee transfer instruction
      const feeInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: feeWallet,
        lamports: serviceFeeLamports,
      });

      // Create a simple fee transaction
      const feeMessage = TransactionMessage.compile({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [feeInstruction]
      });
      const feeTransaction = new VersionedTransaction(feeMessage);

      setSwapStatus("Please sign the transactions...");

      // Sign fee transaction first
      const signedFeeTransaction = await signTransaction(feeTransaction);

      // Sign swap transaction
      const signedSwapTransaction = await signTransaction(transaction);

      setSwapStatus("Sending transactions...");

      // Send fee transaction first
      const feeRawTransaction = signedFeeTransaction.serialize();
      const feeTxid = await connection.sendRawTransaction(feeRawTransaction, {
        skipPreflight: true,
        maxRetries: 2
      });

      // Wait a moment then send swap transaction
      await new Promise(resolve => setTimeout(resolve, 1000));

      const swapRawTransaction = signedSwapTransaction.serialize();
      const swapTxid = await connection.sendRawTransaction(swapRawTransaction, {
        skipPreflight: true,
        maxRetries: 2
      });

      setSwapStatus("Confirming transactions...");

      // Confirm both transactions
      await Promise.all([
        connection.confirmTransaction(feeTxid),
        connection.confirmTransaction(swapTxid)
      ]);

      setSwapStatus(`Swap successful! Tx: ${swapTxid}`);

      // Reset form after successful swap
      setTimeout(() => {
        setAmount("");
        setSwapStatus("");
      }, 5000);

    } catch (e: any) {
      console.error('Swap error:', e);
      if (e?.message?.includes('User rejected')) {
        setError("Transaction rejected by user");
      } else if (e?.message?.includes('Insufficient')) {
        setError(e.message);
      } else if (e?.message?.includes('Network')) {
        setError("Network error. Please try again.");
      } else {
        setError("Swap failed: " + (e?.message || 'Unknown error'));
      }
      setSwapStatus("");
    }
  }

  if (!connected) {
    return (
      <div className="swap-form card">
        <div className="connect-message">
          <h3>Connect Your Phantom Wallet</h3>
          <p>Please connect your Phantom wallet to start swapping tokens</p>
        </div>
      </div>
    );
  }

  return (
    <form className="swap-form card" onSubmit={handleSwap} autoComplete="off">
      <label className="swap-label">From Token</label>
      <select className="swap-input" value={fromMint} onChange={e => setFromMint(e.target.value)}>
        <option value="So11111111111111111111111111111111111111112">SOL</option>
        <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
        <option value="DezXAZ8z7PnrnRJjz3wXBoRhwTLdMPkqhuBczetogeoK">BONK</option>
        <option value="EKpQGSJtjMFqKZ9KQanSqYXRcF8fBtUk6goG7zcX3New">WIF</option>
      </select>

      <label className="swap-label">To Token</label>
      <select className="swap-input" value={toMint} onChange={e => setToMint(e.target.value)}>
        <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
        <option value="So11111111111111111111111111111111111111112">SOL</option>
        <option value="DezXAZ8z7PnrnRJjz3wXBoRhwTLdMPkqhuBczetogeoK">BONK</option>
        <option value="EKpQGSJtjMFqKZ9KQanSqYXRcF8fBtUk6goG7zcX3New">WIF</option>
      </select>

      <label className="swap-label">Amount</label>
      <input
        className="swap-input"
        type="number"
        min="0"
        step="any"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Enter amount"
      />

      <label className="swap-label">Slippage Tolerance</label>
      <div className="slippage-controls">
        {[0.1, 0.5, 1.0].map(value => (
          <button
            key={value}
            type="button"
            className={`slippage-btn ${slippage === value ? 'active' : ''}`}
            onClick={() => setSlippage(value)}
          >
            {value}%
          </button>
        ))}
        <input
          type="number"
          className="slippage-input"
          min="0.1"
          max="50"
          step="0.1"
          value={slippage}
          onChange={e => setSlippage(Number(e.target.value))}
          placeholder="Custom"
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div id="swapRatio">
        {quoteLoading ? <span className="spinner"/> : (
          quote ? (
            <div>
              <div>Rate: <b>{amount} {TOKEN_SYMBOLS[fromMint]}</b> ≈ <b>{(Number(quote.outAmount)/Math.pow(10,TOKEN_DECIMALS[toMint])).toFixed(6)} {TOKEN_SYMBOLS[toMint]}</b></div>
              <div className="quote-details">
                Price Impact: <span className={Number(quote.priceImpactPct) > 1 ? 'high-impact' : 'low-impact'}>
                  {(Number(quote.priceImpactPct) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          ) : amount && fromMint !== toMint ? <span style={{color:"#f73e3e"}}>No route found.</span> : null
        )}
      </div>

      <button className="swap-btn" type="submit" disabled={!quote || !connected || quoteLoading}>
        {quoteLoading ? 'Finding Route...' : 'Swap Tokens'}
      </button>

      {swapStatus && (
        <div id="swapStatus" className={swapStatus.includes('successful') ? 'success-message' : 'status-message'}>
          {swapStatus}
        </div>
      )}
    </form>
  );
}
