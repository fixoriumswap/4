import { Keypair } from '@solana/web3.js'
import { createHash } from 'crypto'

export interface MobileWalletInfo {
  publicKey: string
  privateKey: Uint8Array
}

export class MobileWalletService {
  /**
   * Generate a deterministic wallet from mobile number
   * @param phoneNumber - The user's phone number (normalized)
   * @param secret - Server secret for additional security
   * @returns Wallet information including public key and private key
   */
  static generateWalletFromMobile(phoneNumber: string, secret: string): MobileWalletInfo {
    if (!phoneNumber || !secret) {
      throw new Error('Phone number and secret are required')
    }

    // Create deterministic seed from phone number and server secret
    const seed = createHash('sha256')
      .update(phoneNumber + secret + 'solana-mobile-wallet')
      .digest()

    // Generate keypair from seed
    const keypair = Keypair.fromSeed(seed)

    return {
      publicKey: keypair.publicKey.toString(),
      privateKey: keypair.secretKey
    }
  }

  /**
   * Validate a phone number format
   * @param phoneNumber - Phone number to validate
   * @returns boolean indicating if phone number is valid
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))
  }

  /**
   * Normalize phone number (remove formatting)
   * @param phoneNumber - Phone number to normalize
   * @returns Normalized phone number
   */
  static normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[\s\-\(\)]/g, '')
  }

  /**
   * Format phone number for display
   * @param phoneNumber - Phone number to format
   * @returns Formatted phone number
   */
  static formatPhoneNumber(phoneNumber: string): string {
    const phone = phoneNumber.replace(/\D/g, '')
    if (phone.length <= 3) return phone
    if (phone.length <= 6) return `${phone.slice(0, 3)} ${phone.slice(3)}`
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 10)}`
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
