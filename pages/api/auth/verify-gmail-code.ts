import { NextApiRequest, NextApiResponse } from 'next'
import { createHash } from 'crypto'
import { sign } from 'jsonwebtoken'
import { verificationCodes } from './send-gmail-code'

// Generate deterministic wallet seed from Gmail address
function generateWalletSeed(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret'
  return createHash('sha256')
    .update(email + secret + 'solana-gmail-wallet')
    .digest('hex')
}

// Generate session token
function generateSessionToken(email: string, walletSeed: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret'
  const payload = {
    email,
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
    const { email, code, type = 'signin' } = req.body

    console.log('🔐 Verify Gmail Code Request:', { email, code: code?.substring(0, 2) + '****', type })

    if (!email || !code) {
      return res.status(400).json({ error: 'Email address and verification code are required' })
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Check if code exists and is valid
    const storedData = verificationCodes.get(normalizedEmail)
    
    if (!storedData) {
      return res.status(400).json({ error: 'No verification code found. Please request a new code.' })
    }

    // Check if code has expired (10 minutes)
    const isExpired = Date.now() - storedData.timestamp > 10 * 60 * 1000
    if (isExpired) {
      verificationCodes.delete(normalizedEmail)
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' })
    }

    // Verify the code
    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Code is valid, clean up
    verificationCodes.delete(normalizedEmail)

    // Generate wallet seed and session token
    const walletSeed = generateWalletSeed(normalizedEmail)
    const sessionToken = generateSessionToken(normalizedEmail, walletSeed)

    console.log('✅ Gmail verification successful for:', normalizedEmail)

    // Set session cookie
    res.setHeader('Set-Cookie', [
      `gmail-wallet-session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`, // 30 days
      `gmail-wallet-email=${encodeURIComponent(normalizedEmail)}; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}` // 30 days
    ])

    res.status(200).json({
      success: true,
      message: type === 'signin' ? 'Successfully signed in with Gmail' : 'Account recovered successfully',
      user: {
        email: normalizedEmail,
        walletSeed
      },
      sessionToken
    })

  } catch (error) {
    console.error('Verify Gmail code error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
