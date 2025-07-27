import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Platform fee configuration
const PLATFORM_FEE_AMOUNT = 0.0005; // 0.0005 SOL
const PLATFORM_FEE_ADDRESS = 'FNVD1wied3e8WMuWs34KSamrCpughCMTjoXUE1ZXa6wM';

interface SendReceiveProps {
  onClose: () => void;
}

export default function SendReceive({ onClose }: SendReceiveProps) {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showQR, setShowQR] = useState(false);

  // Fetch wallet balance
  useEffect(() => {
    async function fetchBalance() {
      if (!publicKey || !connection) return;
      
      try {
        const solBalance = await connection.getBalance(publicKey);
        setBalance(solBalance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    }

    fetchBalance();
  }, [publicKey, connection]);

  const handleSend = async () => {
    if (!publicKey || !signTransaction || !recipientAddress || !amount) {
      setStatus('Please fill all fields');
      return;
    }

    setLoading(true);
    setStatus('Preparing transaction...');

    try {
      // Validate recipient address
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipientAddress);
      } catch {
        setStatus('❌ Invalid recipient address');
        setLoading(false);
        return;
      }

      // Check if amount is valid
      const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
      if (lamports <= 0) {
        setStatus('❌ Invalid amount');
        setLoading(false);
        return;
      }

      // Calculate total amount needed (send amount + platform fee + transaction fees)
      const platformFeeLamports = Math.floor(PLATFORM_FEE_AMOUNT * LAMPORTS_PER_SOL);
      const transactionFeeLamports = 10000; // ~0.00001 SOL estimated transaction fee
      const totalRequired = lamports + platformFeeLamports + transactionFeeLamports;

      if (totalRequired > balance * LAMPORTS_PER_SOL) {
        setStatus(`❌ Insufficient balance. Need ${(totalRequired / LAMPORTS_PER_SOL).toFixed(6)} SOL (including platform fee)`);
        setLoading(false);
        return;
      }

      setStatus('Creating transactions...');

      // Create transaction with both transfers (recipient + platform fee)
      const platformFeeAddress = new PublicKey(PLATFORM_FEE_ADDRESS);
      const platformFeeLamports = Math.floor(PLATFORM_FEE_AMOUNT * LAMPORTS_PER_SOL);

      const transaction = new Transaction()
        .add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports,
          })
        )
        .add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: platformFeeAddress,
            lamports: platformFeeLamports,
          })
        );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      setStatus('Please sign the transaction...');

      // Sign transaction
      const signedTransaction = await signTransaction(transaction);

      setStatus('Sending transaction...');

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      setStatus(`Transaction sent! Confirming... Signature: ${signature}`);

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        setStatus(`❌ Transaction failed: ${confirmation.value.err}`);
      } else {
        setStatus(`✅ Transaction successful! Signature: ${signature}`);
        setAmount('');
        setRecipientAddress('');
        // Refresh balance
        const newBalance = await connection.getBalance(publicKey);
        setBalance(newBalance / LAMPORTS_PER_SOL);
      }

    } catch (error: any) {
      console.error('Send error:', error);
      setStatus(`❌ Send failed: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setStatus('✅ Address copied to clipboard!');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const generateQRCode = () => {
    if (publicKey) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${publicKey.toString()}`;
      return qrUrl;
    }
    return '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content send-receive-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send & Receive SOL</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            Send SOL
          </button>
          <button 
            className={`tab-btn ${activeTab === 'receive' ? 'active' : ''}`}
            onClick={() => setActiveTab('receive')}
          >
            Receive SOL
          </button>
        </div>

        <div className="balance-info">
          <span>Balance: {balance.toFixed(4)} SOL</span>
        </div>

        {activeTab === 'send' ? (
          <div className="send-section">
            <div className="input-group">
              <label>Recipient Address</label>
              <input
                type="text"
                className="address-input"
                placeholder="Enter recipient's wallet address"
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
                />
                <button
                  type="button"
                  className="max-btn"
                  onClick={() => setAmount((balance * 0.99).toFixed(6))} // Leave some for fees
                >
                  MAX
                </button>
              </div>
            </div>

            <button
              className="send-btn"
              onClick={handleSend}
              disabled={loading || !amount || !recipientAddress}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Sending...
                </>
              ) : (
                'Send SOL'
              )}
            </button>
          </div>
        ) : (
          <div className="receive-section">
            <div className="receive-content">
              <p>Share your wallet address to receive SOL:</p>
              
              <div className="address-display">
                <div className="address-text">
                  {publicKey?.toString()}
                </div>
                <button className="copy-address-btn" onClick={copyAddress}>
                  📋 Copy
                </button>
              </div>

              <div className="qr-section">
                <button 
                  className="qr-toggle-btn"
                  onClick={() => setShowQR(!showQR)}
                >
                  {showQR ? 'Hide QR Code' : 'Show QR Code'}
                </button>
                
                {showQR && (
                  <div className="qr-code-container">
                    <img 
                      src={generateQRCode()} 
                      alt="Wallet QR Code"
                      className="qr-code"
                    />
                    <p className="qr-description">
                      Scan this QR code to get the wallet address
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {status && (
          <div className="transaction-status">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
