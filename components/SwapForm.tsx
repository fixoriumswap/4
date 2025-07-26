import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
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

export default function SwapForm() {
  const { publicKey, wallet, signTransaction } = useWallet();
  const [fromMint, setFromMint] = useState("So11111111111111111111111111111111111111112");
  const [toMint, setToMint] = useState("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState("");

  const jupiterQuoteApi = createJupiterApiClient();

  useEffect(() => {
    async function fetchQuote() {
      setQuote(null);
      setSwapStatus("");
      if (!fromMint || !toMint || !amount || Number(amount) <= 0 || fromMint === toMint) return;
      setQuoteLoading(true);
      try {
        const amountAtoms = Math.floor(Number(amount) * Math.pow(10, TOKEN_DECIMALS[fromMint]));
        const quote = await jupiterQuoteApi.quoteGet({
          inputMint: fromMint,
          outputMint: toMint,
          amount: amountAtoms,
          slippageBps: 50 // 0.5%
        });
        setQuote(quote);
      } catch (e) {
        setQuote(null);
      }
      setQuoteLoading(false);
    }
    fetchQuote();
  }, [fromMint, toMint, amount]);

  async function handleSwap(e: React.FormEvent) {
    e.preventDefault();
    setSwapStatus("Preparing swap...");
    try {
      if (!quote || !publicKey || !wallet || !signTransaction) {
        return setSwapStatus("No route or wallet.");
      }

      const connection = new Connection(RPC_URL);

      // Get swap transaction
      const swapResult = await jupiterQuoteApi.swapPost({
        swapRequest: {
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true,
        }
      });

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);

      // Execute the transaction
      const txid = await connection.sendTransaction(signedTransaction);

      setSwapStatus("Swap submitted! Tx: " + txid);

      // Confirm transaction
      await connection.confirmTransaction(txid);
      setSwapStatus("Swap confirmed! Tx: " + txid);

    } catch (e: any) {
      setSwapStatus("Swap failed: " + (e?.message || e));
    }
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
      <input className="swap-input" type="number" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" />
      <div id="swapRatio">
        {quoteLoading ? <span className="spinner"/> : (
          quote ? (
            <div>
              Rate: <b>{amount} {TOKEN_SYMBOLS[fromMint]}</b> ≈ <b>{(quote.outAmount/Math.pow(10,TOKEN_DECIMALS[toMint])).toFixed(6)} {TOKEN_SYMBOLS[toMint]}</b>
            </div>
          ) : amount && fromMint !== toMint ? <span style={{color:"#f73e3e"}}>No route found.</span> : null
        )}
      </div>
      <button className="swap-btn" type="submit" disabled={!quote || !publicKey}>Swap</button>
      <div id="swapStatus" style={{marginTop:"10px"}}>{swapStatus}</div>
    </form>
  );
    }
