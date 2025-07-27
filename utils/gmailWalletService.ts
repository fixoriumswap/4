import { Keypair } from '@solana/web3.js'
import { createHash } from 'crypto'

export interface GmailWalletInfo {
  publicKey: string
  privateKey: Uint8Array
}

export class GmailWalletService {
  /**
   * Generate a deterministic wallet from Gmail address
   * @param email - The user's Gmail address (normalized)
   * @param secret - Server secret for additional security
   * @returns Wallet information including public key and private key
   */
  static generateWalletFromGmail(email: string, secret: string): GmailWalletInfo {
    if (!email || !secret) {
      throw new Error('Email and secret are required')
    }

    // Create deterministic seed from email and server secret
    const seed = createHash('sha256')
      .update(email + secret + 'solana-gmail-wallet')
      .digest()

    // Generate keypair from seed
    const keypair = Keypair.fromSeed(seed)

    return {
      publicKey: keypair.publicKey.toString(),
      privateKey: keypair.secretKey
    }
  }

  /**
   * Validate a Gmail email format
   * @param email - Email to validate
   * @returns boolean indicating if email is valid Gmail
   */
  static validateGmailAddress(email: string): boolean {
    const emailRegex = /^[^\s@]+@gmail\.com$/i
    return emailRegex.test(email.toLowerCase())
  }

  /**
   * Normalize Gmail address (lowercase and trim)
   * @param email - Email to normalize
   * @returns Normalized email
   */
  static normalizeGmailAddress(email: string): string {
    return email.toLowerCase().trim()
  }

  /**
   * Validate wallet seed format
   * @param seed - Wallet seed to validate
   * @returns boolean indicating if seed is valid
   */
  static validateWalletSeed(seed: string): boolean {
    return typeof seed === 'string' && seed.length === 64 && /^[a-f0-9]+$/i.test(seed)
  }
}
