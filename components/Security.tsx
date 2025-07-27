import React, { useState, useEffect } from 'react';
import { useWalletContext } from './WalletContext';

interface SecurityHook {
  checkTransactionSecurity: (transaction: any) => SecurityResult;
  validateAddress: (address: string) => boolean;
  checkNetworkSecurity: () => Promise<NetworkSecurity>;
  getSecurityRecommendations: () => string[];
}

interface SecurityResult {
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  recommendations: string[];
  allowTransaction: boolean;
}

interface NetworkSecurity {
  isMainnet: boolean;
  rpcSecurity: 'secure' | 'warning' | 'unsafe';
  connectionEncrypted: boolean;
}

// Known malicious addresses (in a real app, this would be fetched from a security service)
const KNOWN_MALICIOUS_ADDRESSES = new Set([
  // Add known malicious addresses here
]);

// Known safe validator addresses
const SAFE_VALIDATORS = new Set([
  'Stake11111111111111111111111111111111111111',
  'MarinadeA1gorithmicDe1egationStrategy111111',
  'oRAnGeU5h8h2UkvbfnE5cjXnnAa4rBoaxmS4kbFymSe',
  'J1to3PQfXidUUhprQWgdKkQAMWPJAEqSJ7amkBDE9qhF'
]);

export function useSecurity(): SecurityHook {
  const { publicKey } = useWalletContext();

  const checkTransactionSecurity = (transaction: any): SecurityResult => {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let allowTransaction = true;

    // Check for suspicious amounts
    if (transaction.amount && transaction.amount > 1000) {
      warnings.push('Large transaction amount detected');
      riskLevel = 'medium';
      recommendations.push('Verify the recipient address carefully');
    }

    // Check recipient address
    if (transaction.recipient) {
      if (KNOWN_MALICIOUS_ADDRESSES.has(transaction.recipient)) {
        warnings.push('WARNING: Recipient address is flagged as potentially malicious');
        riskLevel = 'high';
        allowTransaction = false;
      }

      // Check if sending to self
      if (publicKey && transaction.recipient === publicKey.toString()) {
        warnings.push('Transaction is sending to your own address');
        recommendations.push('Verify this is intentional');
      }
    }

    // Check validator for staking
    if (transaction.type === 'stake' && transaction.validator) {
      if (!SAFE_VALIDATORS.has(transaction.validator)) {
        warnings.push('Validator not in known safe list');
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
        recommendations.push('Research validator reputation before staking');
      }
    }

    // Check swap parameters
    if (transaction.type === 'swap') {
      if (transaction.slippage && transaction.slippage > 5) {
        warnings.push('High slippage tolerance may result in unfavorable rates');
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
        recommendations.push('Consider reducing slippage tolerance');
      }
    }

    return {
      riskLevel,
      warnings,
      recommendations,
      allowTransaction
    };
  };

  const validateAddress = (address: string): boolean => {
    try {
      // Basic Solana address validation
      if (address.length < 32 || address.length > 44) return false;
      
      // Check for valid base58 characters
      const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
      if (!base58Regex.test(address)) return false;

      return true;
    } catch {
      return false;
    }
  };

  const checkNetworkSecurity = async (): Promise<NetworkSecurity> => {
    // Check if we're on mainnet
    const isMainnet = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('devnet') &&
                     !window.location.hostname.includes('testnet');

    // Check RPC security (simplified)
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const rpcSecurity = rpcUrl.startsWith('https://') ? 'secure' : 'warning';

    // Check connection encryption
    const connectionEncrypted = window.location.protocol === 'https:';

    return {
      isMainnet,
      rpcSecurity,
      connectionEncrypted
    };
  };

  const getSecurityRecommendations = (): string[] => {
    return [
      'Always verify recipient addresses before sending transactions',
      'Keep your wallet software updated to the latest version',
      'Never share your seed phrase or private keys with anyone',
      'Use hardware wallets for large amounts',
      'Double-check transaction details before signing',
      'Be cautious of phishing websites and always verify URLs',
      'Consider using smaller test amounts for new interactions'
    ];
  };

  return {
    checkTransactionSecurity,
    validateAddress,
    checkNetworkSecurity,
    getSecurityRecommendations
  };
}

interface SecurityStatusProps {
  className?: string;
}

export function SecurityStatus({ className = '' }: SecurityStatusProps) {
  const [networkSecurity, setNetworkSecurity] = useState<NetworkSecurity | null>(null);
  const { checkNetworkSecurity } = useSecurity();

  useEffect(() => {
    checkNetworkSecurity().then(setNetworkSecurity);
  }, []);

  if (!networkSecurity) return null;

  return (
    <div className={`security-status ${className}`}>
      <div className="security-indicators">
        <div className={`security-indicator ${networkSecurity.connectionEncrypted ? 'secure' : 'warning'}`}>
          <span className="indicator-icon">
            {networkSecurity.connectionEncrypted ? '🔒' : '⚠️'}
          </span>
          <span className="indicator-text">
            {networkSecurity.connectionEncrypted ? 'Secure Connection' : 'Insecure Connection'}
          </span>
        </div>
        
        <div className={`security-indicator ${networkSecurity.isMainnet ? 'secure' : 'warning'}`}>
          <span className="indicator-icon">
            {networkSecurity.isMainnet ? '🌐' : '🧪'}
          </span>
          <span className="indicator-text">
            {networkSecurity.isMainnet ? 'Mainnet' : 'Test Network'}
          </span>
        </div>

        <div className={`security-indicator ${networkSecurity.rpcSecurity}`}>
          <span className="indicator-icon">
            {networkSecurity.rpcSecurity === 'secure' ? '🛡️' : '⚠️'}
          </span>
          <span className="indicator-text">
            RPC {networkSecurity.rpcSecurity === 'secure' ? 'Secure' : 'Warning'}
          </span>
        </div>
      </div>

      <style jsx>{`
        .security-status {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .security-indicators {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .security-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .security-indicator.secure {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .security-indicator.warning {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .security-indicator.unsafe {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .indicator-icon {
          font-size: 14px;
        }

        .indicator-text {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .security-indicators {
            flex-direction: column;
          }

          .security-indicator {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default function SecurityComponent() {
  const { getSecurityRecommendations } = useSecurity();
  const recommendations = getSecurityRecommendations();

  return (
    <div className="security-component">
      <div className="security-header">
        <h3>Security Center</h3>
        <p>Stay safe while using your wallet</p>
      </div>

      <SecurityStatus />

      <div className="security-recommendations">
        <h4>Security Best Practices</h4>
        <div className="recommendations-list">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="recommendation-item">
              <span className="recommendation-icon">💡</span>
              <span className="recommendation-text">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .security-component {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .security-header h3 {
          margin: 0 0 8px 0;
          color: #e2e8f0;
          font-size: 20px;
        }

        .security-header p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
        }

        .security-recommendations {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .security-recommendations h4 {
          margin: 0 0 16px 0;
          color: #e2e8f0;
          font-size: 16px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .recommendation-icon {
          font-size: 16px;
          margin-top: 2px;
        }

        .recommendation-text {
          font-size: 14px;
          color: #e2e8f0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
