import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api';
import TokenSearch from './TokenSearch';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export default function SwapForm() {
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
  const [receiveAddress, setReceiveAddress] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState("");
  const [fromBalance, setFromBalance] = useState<number>(0);
  const [toBalance, setToBalance] = useState<number>(0);

  const jupiterQuoteApi = createJupiterApiClient();
  const connection = new Connection(RPC_URL);

  // Fetch token balances
  useEffect(() => {
    async function fetchBalances() {
      if (!publicKey) {
        setFromBalance(0);
        setToBalance(0);
        return;
      }

      try {
        // Fetch FROM token balance
        if (fromToken.address === "So11111111111111111111111111111111111111112") {
          const solBalance = await connection.getBalance(publicKey);
          setFromBalance(solBalance / Math.pow(10, 9));
        } else {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: new PublicKey(fromToken.address)
          });
          if (tokenAccounts.value.length > 0) {
            const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
            setFromBalance(balance);
          } else {
            setFromBalance(0);
          }
        }

        // Fetch TO token balance
        if (toToken.address === "So11111111111111111111111111111111111111112") {
          const solBalance = await connection.getBalance(publicKey);
          setToBalance(solBalance / Math.pow(10, 9));
        } else {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: new PublicKey(toToken.address)
          });
          if (tokenAccounts.value.length > 0) {
            const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
            setToBalance(balance);
          } else {
            setToBalance(0);
          }
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    }

    fetchBalances();
  }, [publicKey, fromToken, toToken]);

  // Real-time quote fetching with auto-refresh
  useEffect(() => {
    async function fetchQuote() {
      setQuote(null);
      setSwapStatus("");
      if (!fromToken.address || !toToken.address || !amount || Number(amount) <= 0 || fromToken.address === toToken.address) return;

      setQuoteLoading(true);
      try {
        const amountAtoms = Math.floor(Number(amount) * Math.pow(10, fromToken.decimals));
        const quote = await jupiterQuoteApi.quoteGet({
          inputMint: fromToken.address,
          outputMint: toToken.address,
          amount: amountAtoms,
          slippageBps: 50 // 0.5%
        });
        setQuote(quote);
      } catch (e) {
        console.error('Quote error:', e);
        setQuote(null);
      }
      setQuoteLoading(false);
    }

    fetchQuote();

    // Auto-refresh quotes every 10 seconds
    const interval = setInterval(fetchQuote, 10000);
    return () => clearInterval(interval);
  }, [fromToken, toToken, amount]);

  // Set receive address to user's wallet by default
  useEffect(() => {
    if (publicKey && !receiveAddress) {
      setReceiveAddress(publicKey.toString());
    }
  }, [publicKey]);

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
              Rate: <b>{amount} {TOKEN_SYMBOLS[fromMint]}</b> ≈ <b>{(parseInt(quote.outAmount)/Math.pow(10,TOKEN_DECIMALS[toMint])).toFixed(6)} {TOKEN_SYMBOLS[toMint]}</b>
            </div>
          ) : amount && fromMint !== toMint ? <span style={{color:"#f73e3e"}}>No route found.</span> : null
        )}
      </div>
      <button className="swap-btn" type="submit" disabled={!quote || !publicKey}>Swap</button>
      <div id="swapStatus" style={{marginTop:"10px"}}>{swapStatus}</div>
    </form>
  );
    }
