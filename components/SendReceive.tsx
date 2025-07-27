import React, { useState, useEffect } from 'react';
import { useWalletContext } from './WalletContext';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { 
  createTransferInstruction, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

interface Token {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  logoURI?: string;
}

export default function SendReceive() {
  const { publicKey, keypair, isConnected: connected } = useWalletContext();
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      fetchTokens();
    }
  }, [connected, publicKey]);

  const fetchTokens = async () => {
    if (!publicKey) return;

    try {
      const connection = new Connection(RPC_URL);
      
      // Get SOL balance
      const solBalance = await connection.getBalance(publicKey);
      const solAmount = solBalance / LAMPORTS_PER_SOL;

      // Get token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const tokenList: Token[] = [
        {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9,
          balance: solAmount
        }
      ];

      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info;
        const balance = accountData.tokenAmount.uiAmount;
        
        if (balance && balance > 0) {
          tokenList.push({
            mint: accountData.mint,
            symbol: getTokenSymbol(accountData.mint),
            name: getTokenName(accountData.mint),
            decimals: accountData.tokenAmount.decimals,
            balance: balance
          });
        }
      }

      setTokens(tokenList);
      if (!selectedToken && tokenList.length > 0) {
        setSelectedToken(tokenList[0]);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const getTokenSymbol = (mint: string): string => {
    const knownTokens: Record<string, string> = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
    };
    return knownTokens[mint] || 'Unknown';
  };

  const getTokenName = (mint: string): string => {
    const knownTokens: Record<string, string> = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USD Coin',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'Tether USD',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'Marinade SOL',
    };
    return knownTokens[mint] || 'Unknown Token';
  };

  const validateRecipient = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleSend = async () => {
    if (!publicKey || !keypair || !selectedToken) {
      setStatus('Wallet not connected');
      return;
    }

    if (!recipient || !validateRecipient(recipient)) {
      setStatus('Invalid recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus('Invalid amount');
      return;
    }

    if (parseFloat(amount) > selectedToken.balance) {
      setStatus('Insufficient balance');
      return;
    }

    setLoading(true);
    setStatus('Preparing transaction...');

    try {
      const connection = new Connection(RPC_URL);
      const recipientPubkey = new PublicKey(recipient);
      const amountNumber = parseFloat(amount);

      if (selectedToken.symbol === 'SOL') {
        // Send SOL
        const lamports = Math.floor(amountNumber * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports: lamports
          })
        );

        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = publicKey;

        setStatus('Signing transaction...');
        transaction.sign([keypair]);
        const signedTransaction = transaction;

        setStatus('Sending transaction...');
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        setStatus('Confirming transaction...');
        await connection.confirmTransaction(signature, 'confirmed');
        
        setStatus(`✅ Transaction successful! Signature: ${signature}`);
        
        // Reset form
        setAmount('');
        setRecipient('');
        setMemo('');
        
        // Refresh balances
        fetchTokens();
      } else {
        // Send SPL Token
        const mintPubkey = new PublicKey(selectedToken.mint);
        const tokenAmount = Math.floor(amountNumber * Math.pow(10, selectedToken.decimals));

        // Get sender's token account
        const senderTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          publicKey
        );

        // Get or create recipient's token account
        const recipientTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          recipientPubkey
        );

        const transaction = new Transaction();
        
        // Check if recipient token account exists
        const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
        if (!recipientAccountInfo) {
          // Create recipient token account
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              recipientTokenAccount,
              recipientPubkey,
              mintPubkey
            )
          );
        }

        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            senderTokenAccount,
            recipientTokenAccount,
            publicKey,
            tokenAmount
          )
        );

        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = publicKey;

        setStatus('Signing transaction...');
        transaction.sign([keypair]);
        const signedTransaction = transaction;

        setStatus('Sending transaction...');
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());

        setStatus('Confirming transaction...');
        await connection.confirmTransaction(signature, 'confirmed');

        setStatus(`✅ Transaction successful! Signature: ${signature}`);

        // Reset form
        setAmount('');
        setRecipient('');
        setMemo('');

        // Refresh balances
        fetchTokens();
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      setStatus(`❌ Transfer failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="send-receive">
      {/* Tab Navigation */}
      <div className="tab-switcher">
        <button
          className={`tab-switch-btn ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          💸 Send
        </button>
        <button
          className={`tab-switch-btn ${activeTab === 'receive' ? 'active' : ''}`}
          onClick={() => setActiveTab('receive')}
        >
          ��� Receive
        </button>
      </div>

      {activeTab === 'send' ? (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Send Tokens</h2>
            <p className="card-subtitle">Transfer tokens to another wallet</p>
          </div>

          <div className="send-form">
            {/* Token Selection */}
            <div className="form-group">
              <label className="form-label">Select Token</label>
              <div className="token-selector">
                {tokens.map((token) => (
                  <button
                    key={token.mint}
                    className={`token-option ${selectedToken?.mint === token.mint ? 'selected' : ''}`}
                    onClick={() => setSelectedToken(token)}
                  >
                    <div className="token-option-info">
                      <div className="token-option-symbol">{token.symbol}</div>
                      <div className="token-option-balance">
                        {token.balance.toFixed(6)} {token.symbol}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Address */}
            <div className="form-group">
              <label className="form-label">Recipient Address</label>
              <input
                type="text"
                className="input"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter Solana wallet address"
              />
              {recipient && !validateRecipient(recipient) && (
                <div className="form-help error">Invalid Solana address</div>
              )}
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">
                Amount
                {selectedToken && (
                  <span className="balance-indicator">
                    Balance: {selectedToken.balance.toFixed(6)} {selectedToken.symbol}
                  </span>
                )}
              </label>
              <div className="amount-input-container">
                <input
                  type="number"
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="any"
                />
                <button
                  type="button"
                  className="max-button"
                  onClick={() => selectedToken && setAmount(selectedToken.balance.toString())}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Memo (Optional) */}
            <div className="form-group">
              <label className="form-label">Memo (Optional)</label>
              <input
                type="text"
                className="input"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Add a note (not stored on-chain)"
                maxLength={100}
              />
            </div>

            {/* Send Button */}
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handleSend}
              disabled={loading || !connected || !selectedToken || !recipient || !amount}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Sending...
                </>
              ) : (
                'Send Tokens'
              )}
            </button>

            {/* Status */}
            {status && (
              <div className={`status-message ${status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : 'info'}`}>
                {status}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Receive Tokens</h2>
            <p className="card-subtitle">Share your wallet address to receive tokens</p>
          </div>

          <div className="receive-content">
            <div className="qr-code-placeholder">
              <div className="qr-icon">📱</div>
              <div className="qr-text">QR Code</div>
              <div className="qr-subtext">Scan to get wallet address</div>
            </div>

            <div className="address-section">
              <label className="form-label">Your Wallet Address</label>
              <div className="address-display">
                <div className="address-text">
                  {publicKey ? publicKey.toString() : 'No wallet connected'}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={copyAddress}
                  disabled={!publicKey}
                >
                  {copied ? '✅ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="form-help">
                Share this address with others to receive SOL and SPL tokens
              </div>
            </div>

            <div className="receive-info">
              <div className="info-item">
                <div className="info-icon">ℹ️</div>
                <div className="info-text">
                  <strong>Send only Solana tokens to this address.</strong>
                  Sending tokens from other networks will result in permanent loss.
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">⚡</div>
                <div className="info-text">
                  <strong>Network:</strong> Solana Mainnet
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .send-receive {
          max-width: 600px;
          margin: 0 auto;
        }

        .tab-switcher {
          display: flex;
          background: rgba(30, 35, 52, 0.8);
          border-radius: 16px;
          padding: 6px;
          margin-bottom: 24px;
          gap: 6px;
        }

        .tab-switch-btn {
          flex: 1;
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-radius: 12px;
          color: #94a3b8;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-switch-btn.active {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: #fff;
        }

        .send-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .token-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .token-option {
          background: rgba(15, 23, 42, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .token-option:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .token-option.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .token-option-symbol {
          font-weight: bold;
          font-size: 16px;
          color: #fff;
          margin-bottom: 4px;
        }

        .token-option-balance {
          font-size: 12px;
          color: #94a3b8;
        }

        .balance-indicator {
          float: right;
          font-size: 12px;
          color: #94a3b8;
          font-weight: normal;
        }

        .amount-input-container {
          position: relative;
        }

        .max-button {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .status-message {
          padding: 16px;
          border-radius: 12px;
          font-size: 14px;
          word-break: break-all;
        }

        .status-message.success {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-message.error {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-message.info {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .receive-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
          align-items: center;
        }

        .qr-code-placeholder {
          width: 200px;
          height: 200px;
          background: rgba(15, 23, 42, 0.4);
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .qr-icon {
          font-size: 48px;
          opacity: 0.6;
        }

        .qr-text {
          font-weight: bold;
          color: #e2e8f0;
        }

        .qr-subtext {
          font-size: 12px;
          color: #94a3b8;
        }

        .address-section {
          width: 100%;
        }

        .address-display {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 8px;
        }

        .address-text {
          flex: 1;
          padding: 16px;
          background: rgba(15, 23, 42, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 14px;
          color: #60a5fa;
          word-break: break-all;
        }

        .receive-info {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .info-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 12px;
          align-items: flex-start;
        }

        .info-icon {
          font-size: 16px;
          margin-top: 2px;
        }

        .info-text {
          font-size: 14px;
          color: #e2e8f0;
          line-height: 1.5;
        }

        .error {
          color: #ef4444;
        }

        @media (max-width: 768px) {
          .token-selector {
            grid-template-columns: 1fr;
          }

          .address-display {
            flex-direction: column;
          }

          .address-text {
            font-size: 12px;
          }

          .qr-code-placeholder {
            width: 150px;
            height: 150px;
          }

          .qr-icon {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}
