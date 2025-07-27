import { Keypair } from '@solana/web3.js';
import * as crypto from 'crypto';
import { createHash } from 'crypto';

export interface WalletInfo {
  publicKey: string;
  privateKey: Uint8Array;
  mnemonic?: string;
}

export class GmailWalletService {
  /**
   * Generate a deterministic wallet from user's Gmail ID
   * This ensures the same wallet is always generated for the same user
   */
  static generateWalletFromGmail(userId: string, secret: string): WalletInfo {
    try {
      // Create a deterministic seed from user ID and app secret
      const seed = createHash('sha256')
        .update(userId + secret + 'solana-wallet')
        .digest();

      // Generate keypair from the deterministic seed
      const keypair = Keypair.fromSeed(seed);

      return {
        publicKey: keypair.publicKey.toString(),
        privateKey: keypair.secretKey,
      };
    } catch (error) {
      console.error('Error generating wallet:', error);
      throw new Error('Failed to generate wallet');
    }
  }

  /**
   * Validate a Solana public key
   */
  static isValidPublicKey(publicKey: string): boolean {
    try {
      const key = new Keypair().publicKey.constructor(publicKey);
      return key.toString() === publicKey;
    } catch {
      return false;
    }
  }

  /**
   * Get wallet balance and token information
   */
  static async getWalletInfo(publicKey: string) {
    // This will be implemented by the components that use this service
    return {
      publicKey,
      balance: 0,
      tokens: []
    };
  }

  /**
   * Encrypt private key for secure storage (if needed)
   */
  static encryptPrivateKey(privateKey: Uint8Array, password: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', password);
    let encrypted = cipher.update(Buffer.from(privateKey), 'binary', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt private key (if needed)
   */
  static decryptPrivateKey(encryptedKey: string, password: string): Uint8Array {
    const decipher = crypto.createDecipher('aes-256-cbc', password);
    let decrypted = decipher.update(encryptedKey, 'hex', 'binary');
    decrypted += decipher.final('binary');
    return new Uint8Array(Buffer.from(decrypted, 'binary'));
  }
}

export default GmailWalletService;
