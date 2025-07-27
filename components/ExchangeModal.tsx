import React, { useState, useEffect } from 'react';
import { useFixoriumWallet, PLATFORM_FEE_AMOUNT, PLATFORM_FEE_ADDRESS } from '../context/FixoriumWallet';
import { Connection, PublicKey, VersionedTransaction, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import TokenSearch from './TokenSearch';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface ExchangeModalProps {
  onClose: () => void;
}

const connection = new Connection('https://api.mainnet-beta.solana.com');

export default function ExchangeModal({ onClose }: ExchangeModalProps) {
  const { balance, getKeypair, publicKey, refreshBalance } = useFixoriumWallet();
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
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState('');

  // Fetch quote
  useEffect(() => {
    async function fetchQuote() {
      setQuote(null);
      setSwapStatus('');

      if (!fromToken.address || !toToken.address || !amount || Number(amount) <= 0 || fromToken.address === toToken.address) {
        return;
      }

      setQuoteLoading(true);

      try {
        const amountAtoms = Math.floor(Number(amount) * Math.pow(10, fromToken.decimals));

        const queryParams = new URLSearchParams({
          inputMint: fromToken.address,
          outputMint: toToken.address,
          amount: amountAtoms.toString(),
          slippageBps: '100',
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

        if (!response.ok) {
          const errorText = await response.text();
          let userFriendlyError = 'Unable to find route';
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.includes('not tradable')) {
              userFriendlyError = `${fromToken.symbol} or ${toToken.symbol} is not available for trading.`;
            } else if (errorData.error?.includes('insufficient liquidity')) {
              userFriendlyError = 'Insufficient liquidity for this trade.';
            }
          } catch (parseError) {
            // Use original error if parsing fails
          }
          throw new Error(userFriendlyError);
        }

        const quoteData = await response.json();
        if (!quoteData || !quoteData.outAmount) {
          throw new Error('Invalid quote response');
        }

        setQuote(quoteData);
      } catch (e: any) {
        console.error('Quote error:', e);
        setSwapStatus(`Quote error: ${e.message || 'Unable to find route'}`);
      } finally {
        setQuoteLoading(false);
      }
    }

    fetchQuote();
  }, [fromToken, toToken, amount]);

  const handleSwap = async () => {
    if (!quote || !publicKey) {
      setSwapStatus('❌ No route or wallet available');
      return;
    }

    const keypair = getKeypair();
    if (!keypair) {
      setSwapStatus('❌ Unable to access wallet');
      return;
    }

    setSwapStatus('Preparing exchange...');

    try {
      // Check balance requirements
      const swapAmount = parseFloat(amount);
      const requiredBalance = fromToken.symbol === 'SOL' ? swapAmount + PLATFORM_FEE_AMOUNT + 0.001 : PLATFORM_FEE_AMOUNT + 0.001;

      if (fromToken.symbol === 'SOL' && balance < requiredBalance) {
        setSwapStatus(`❌ Insufficient SOL. Need ${requiredBalance.toFixed(4)} SOL (including fees)`);
        return;
      } else if (fromToken.symbol !== 'SOL' && balance < PLATFORM_FEE_AMOUNT + 0.001) {
        setSwapStatus(`❌ Insufficient SOL for fees. Need ${(PLATFORM_FEE_AMOUNT + 0.001).toFixed(4)} SOL`);
        return;
      }

      setSwapStatus('Creating transactions...');

      // Create platform fee transaction
      const platformFeeAddress = new PublicKey(PLATFORM_FEE_ADDRESS);
      const platformFeeLamports = Math.floor(PLATFORM_FEE_AMOUNT * LAMPORTS_PER_SOL);
      
      const feeTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: platformFeeAddress,
          lamports: platformFeeLamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      feeTransaction.recentBlockhash = blockhash;
      feeTransaction.feePayer = keypair.publicKey;

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

      setSwapStatus('Please confirm transactions...');

      // Sign platform fee transaction
      feeTransaction.sign(keypair);

      // Sign swap transaction
      const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
      const swapTransaction = VersionedTransaction.deserialize(swapTransactionBuf);
      swapTransaction.sign([keypair]);

      setSwapStatus('Processing exchange...');

      // Send platform fee transaction first
      const feeTxid = await connection.sendRawTransaction(feeTransaction.serialize());
      await connection.confirmTransaction(feeTxid, 'confirmed');

      // Send swap transaction
      const swapTxid = await connection.sendRawTransaction(swapTransaction.serialize());

      setSwapStatus(`Exchange submitted! Confirming... Tx: ${swapTxid}`);

      const confirmation = await connection.confirmTransaction(swapTxid, 'confirmed');

      if (confirmation.value.err) {
        setSwapStatus(`❌ Exchange failed: ${confirmation.value.err}`);
      } else {
        setSwapStatus(`✅ Exchange successful! Tx: ${swapTxid}`);
        setAmount('');
        await refreshBalance();
      }

    } catch (error: any) {
      console.error('Exchange error:', error);
      setSwapStatus(`❌ Exchange failed: ${error.message || error}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content exchange-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔄 Exchange Tokens</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="exchange-content">
          <div className="exchange-form">
            <div className="exchange-section">
              <div className="exchange-label-row">
                <label className="exchange-label">From Token</label>
                <span className="balance-display">Balance: {balance.toFixed(6)} SOL</span>
              </div>
              <TokenSearch
                onTokenSelect={setFromToken}
                placeholder="Select token to exchange from"
                selectedToken={fromToken}
              />
            </div>

            <div className="exchange-section">
              <div className="exchange-label-row">
                <label className="exchange-label">To Token</label>
              </div>
              <TokenSearch
                onTokenSelect={setToToken}
                placeholder="Select token to receive"
                selectedToken={toToken}
              />
            </div>

            <div className="exchange-section">
              <label className="exchange-label">Amount to Exchange</label>
              <div className="amount-input-container">
                <input
                  className="exchange-input"
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
                  onClick={() => {
                    const maxAmount = fromToken.symbol === 'SOL' 
                      ? Math.max(0, balance - PLATFORM_FEE_AMOUNT - 0.001)
                      : balance;
                    setAmount(maxAmount.toFixed(6));
                  }}
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="quote-section">
              {quoteLoading ? (
                <div className="loading-quote">
                  <span className="spinner"/> Finding best rate...
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
                </div>
              ) : amount && fromToken.address !== toToken.address ? (
                <div className="no-quote">
                  <span style={{color:"#f73e3e"}}>No route found</span>
                </div>
              ) : null}
            </div>

            <button
              className="exchange-btn"
              type="button"
              onClick={handleSwap}
              disabled={!quote || quoteLoading}
            >
              {quoteLoading ? 'Finding Route...' :
               quote ? 'Exchange Tokens' : 'Enter Amount'}
            </button>

            {swapStatus && (
              <div className="exchange-status">{swapStatus}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
