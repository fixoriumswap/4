import { NextApiRequest, NextApiResponse } from 'next'
import { createHash } from 'crypto'
import { sign } from 'jsonwebtoken'
import { verificationCodes } from './send-code'

// Generate deterministic wallet seed from phone number
function generateWalletSeed(phoneNumber: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret'
  return createHash('sha256')
    .update(phoneNumber + secret + 'solana-mobile-wallet')
    .digest('hex')
}

// Generate session token
function generateSessionToken(phoneNumber: string, walletSeed: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret'
  const payload = {
    phoneNumber,
    walletSeed,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
  }
  return sign(payload, secret)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { phoneNumber, code, countryCode, type = 'signin' } = req.body

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and verification code are required' })
    }

    if (!countryCode) {
      return res.status(400).json({ error: 'Country code is required' })
    }

    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Check if code exists and is valid
    const storedData = verificationCodes.get(normalizedPhone)
    
    if (!storedData) {
      return res.status(400).json({ error: 'No verification code found. Please request a new code.' })
    }

    // Check if code has expired (10 minutes)
    const isExpired = Date.now() - storedData.timestamp > 10 * 60 * 1000
    if (isExpired) {
      verificationCodes.delete(normalizedPhone)
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' })
    }

    // Verify the code
    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Code is valid, clean up
    verificationCodes.delete(normalizedPhone)

    // Generate wallet seed and session token
    const walletSeed = generateWalletSeed(normalizedPhone)
    const sessionToken = generateSessionToken(normalizedPhone, walletSeed)

    // Set session cookie
    res.setHeader('Set-Cookie', [
      `mobile-wallet-session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`, // 30 days
      `mobile-wallet-phone=${encodeURIComponent(normalizedPhone)}; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}` // 30 days
    ])

    res.status(200).json({
      success: true,
      message: type === 'signin' ? 'Successfully signed in' : 'Account recovered successfully',
      user: {
        phoneNumber: normalizedPhone,
        walletSeed
      },
      sessionToken
    })

  } catch (error) {
    console.error('Verify code error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
