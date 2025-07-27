import React, { useState } from 'react';
import { useFixoriumWallet, PLATFORM_FEE_AMOUNT, PLATFORM_FEE_ADDRESS } from '../context/FixoriumWallet';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WithdrawModalProps {
  onClose: () => void;
}

const connection = new Connection('https://api.mainnet-beta.solana.com');

export default function WithdrawModal({ onClose }: WithdrawModalProps) {
  const { balance, getKeypair, refreshBalance } = useFixoriumWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleWithdraw = async () => {
    if (!recipientAddress || !amount) {
      setStatus('❌ Please fill all fields');
      return;
    }

    setLoading(true);
    setStatus('Preparing withdrawal...');

    try {
      const keypair = getKeypair();
      if (!keypair) {
        throw new Error('Unable to access wallet');
      }

      // Validate recipient address
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipientAddress);
      } catch {
        setStatus('❌ Invalid recipient address');
        setLoading(false);
        return;
      }

      // Calculate amounts
      const withdrawAmount = parseFloat(amount);
      const withdrawLamports = Math.floor(withdrawAmount * LAMPORTS_PER_SOL);
      const platformFeeLamports = Math.floor(PLATFORM_FEE_AMOUNT * LAMPORTS_PER_SOL);
      const networkFee = 10000; // ~0.00001 SOL
      const totalRequired = withdrawLamports + platformFeeLamports + networkFee;

      if (withdrawAmount <= 0) {
        setStatus('❌ Invalid withdrawal amount');
        setLoading(false);
        return;
      }

      if (totalRequired > balance * LAMPORTS_PER_SOL) {
        setStatus(`❌ Insufficient balance. Need ${(totalRequired / LAMPORTS_PER_SOL).toFixed(6)} SOL total`);
        setLoading(false);
        return;
      }

      setStatus('Creating transaction...');

      // Create transaction with both transfers
      const platformFeeAddress = new PublicKey(PLATFORM_FEE_ADDRESS);
      
      const transaction = new Transaction()
        .add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: recipientPubkey,
            lamports: withdrawLamports,
          })
        )
        .add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: platformFeeAddress,
            lamports: platformFeeLamports,
          })
        );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = keypair.publicKey;

      setStatus('Signing transaction...');

      // Sign transaction
      transaction.sign(keypair);

      setStatus('Sending transaction...');

      // Send transaction
      const signature = await connection.sendRawTransaction(transaction.serialize());

      setStatus(`Transaction sent! Confirming... Signature: ${signature}`);

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        setStatus(`❌ Transaction failed: ${confirmation.value.err}`);
      } else {
        setStatus(`✅ Withdrawal successful! Signature: ${signature}`);
        
        // Reset form and refresh balance
        setAmount('');
        setRecipientAddress('');
        await refreshBalance();
      }

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      setStatus(`❌ Withdrawal failed: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const maxWithdraw = Math.max(0, balance - PLATFORM_FEE_AMOUNT - 0.001);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content withdraw-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📤 Withdraw from Fixorium Wallet</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="withdraw-content">
          <div className="balance-info">
            <div className="current-balance">
              <span>Available Balance: <strong>{balance.toFixed(6)} SOL</strong></span>
            </div>
            <div className="max-withdraw">
              <span>Max Withdrawal: <strong>{maxWithdraw.toFixed(6)} SOL</strong></span>
            </div>
          </div>

          <div className="withdraw-form">
            <div className="input-group">
              <label>Recipient Address</label>
              <input
                type="text"
                className="recipient-input"
                placeholder="Enter Solana wallet address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Amount (SOL)</label>
              <div className="amount-input-container">
                <input
                  type="number"
                  className="amount-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.001"
                  min="0"
                  max={maxWithdraw}
                />
                <button
                  type="button"
                  className="max-btn"
                  onClick={() => setAmount(maxWithdraw.toFixed(6))}
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="fee-breakdown">
              <h4>Fee Breakdown:</h4>
              <div className="fee-row">
                <span>Withdrawal Amount:</span>
                <span>{amount || '0.000000'} SOL</span>
              </div>
              <div className="fee-row">
                <span>Platform Fee:</span>
                <span className="platform-fee">{PLATFORM_FEE_AMOUNT} SOL</span>
              </div>
              <div className="fee-row">
                <span>Network Fee:</span>
                <span>~0.00001 SOL</span>
              </div>
              <div className="fee-row total">
                <span><strong>Total Cost:</strong></span>
                <span><strong>{(parseFloat(amount || '0') + PLATFORM_FEE_AMOUNT + 0.00001).toFixed(6)} SOL</strong></span>
              </div>
            </div>

            <button
              className="withdraw-btn"
              onClick={handleWithdraw}
              disabled={loading || !amount || !recipientAddress || parseFloat(amount || '0') <= 0}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Processing...
                </>
              ) : (
                'Withdraw SOL'
              )}
            </button>
          </div>

          {status && (
            <div className="transaction-status">
              {status}
            </div>
          )}

          <div className="withdraw-info">
            <h4>📝 Important Notes:</h4>
            <ul>
              <li>All withdrawals include a {PLATFORM_FEE_AMOUNT} SOL platform fee</li>
              <li>Network fees are additional (~0.00001 SOL)</li>
              <li>Withdrawals are processed immediately</li>
              <li>Double-check recipient address before confirming</li>
              <li>Only Solana network addresses are supported</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
