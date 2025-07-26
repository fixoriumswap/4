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
  const { publicKey, signTransaction } = useWallet();
  const [fromMint, setFromMint] = useState("So11111111111111111111111111111111111111112");
  const [toMint, setToMint] = useState("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState("");

  useEffect(() => {
    async function fetchQuote() {
      setQuote(null);
      setSwapStatus("");
      if (!fromMint || !toMint || !amount || Number(amount) <= 0 || fromMint === toMint) return;
      setQuoteLoading(true);
      try {
        const amountLamports = Math.floor(Number(amount) * Math.pow(10, TOKEN_DECIMALS[fromMint]));
        const params = new URLSearchParams({
          inputMint: fromMint,
          outputMint: toMint,
          amount: amountLamports.toString(),
          slippageBps: '50'
        });

        const response = await fetch(`${JUPITER_API_URL}/quote?${params}`);
        if (response.ok) {
          const quoteData = await response.json();
          setQuote(quoteData);
        } else {
          setQuote(null);
        }
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
      if (!quote || !publicKey || !signTransaction) return setSwapStatus("No route or wallet.");

      const connection = new Connection(RPC_URL);
      const serviceFeeLamports = 0.001 * 1e9; // 0.001 SOL in lamports
      const feeWallet = new PublicKey("FNVD1wied3e8WMuWs34KSamrCpughCMTjoXUE1ZXa6wM");

      // Check if user has enough SOL for the fee
      const balance = await connection.getBalance(publicKey);
      if (balance < serviceFeeLamports) {
        throw new Error('Insufficient SOL balance for service fee');
      }

      const response = await fetch(`${JUPITER_API_URL}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get transaction');
      }

      const { swapTransaction } = await response.json();
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const swapTx = VersionedTransaction.deserialize(swapTransactionBuf);

      // Create fee transfer instruction
      const feeInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: feeWallet,
        lamports: serviceFeeLamports,
      });

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();

      // Create combined transaction with fee and swap
      const combinedMessage = TransactionMessage.compile({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200000 }),
          feeInstruction,
          ...swapTx.message.compiledInstructions.map(ix => ({
            programId: swapTx.message.staticAccountKeys[ix.programIdIndex],
            keys: ix.accountKeyIndexes.map(keyIndex => ({
              pubkey: swapTx.message.staticAccountKeys[keyIndex] || swapTx.message.addressTableLookups[0]?.readonlyIndexes?.[keyIndex - swapTx.message.staticAccountKeys.length],
              isSigner: keyIndex === 0,
              isWritable: !swapTx.message.addressTableLookups[0]?.readonlyIndexes?.includes(keyIndex - swapTx.message.staticAccountKeys.length)
            })),
            data: Buffer.from(ix.data)
          }))
        ]
      });

      const combinedTx = new VersionedTransaction(combinedMessage);

      setSwapStatus("Please sign the transaction...");
      const signedTransaction = await signTransaction(combinedTx);

      setSwapStatus("Sending transaction...");
      const rawTransaction = signedTransaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2
      });

      setSwapStatus("Confirming transaction...");
      await connection.confirmTransaction(txid);
      setSwapStatus(`Swap successful! Tx: ${txid}`);
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
              Rate: <b>{amount} {TOKEN_SYMBOLS[fromMint]}</b> ≈ <b>{(Number(quote.outAmount)/Math.pow(10,TOKEN_DECIMALS[toMint])).toFixed(6)} {TOKEN_SYMBOLS[toMint]}</b>
            </div>
          ) : amount && fromMint !== toMint ? <span style={{color:"#f73e3e"}}>No route found.</span> : null
        )}
      </div>
      <button className="swap-btn" type="submit" disabled={!quote || !publicKey}>Swap</button>
      <div id="swapStatus" style={{marginTop:"10px"}}>{swapStatus}</div>
    </form>
  );
    }
