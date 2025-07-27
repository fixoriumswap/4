import { NextApiRequest, NextApiResponse } from 'next'
import { createHash } from 'crypto'

// In-memory storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string, timestamp: number, attempts: number }>()

// Generate a 6-digit verification code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.toLowerCase())
}

// Check if email is a Gmail address
function isGmailAddress(email: string): boolean {
  return email.toLowerCase().endsWith('@gmail.com')
}

// Simulate sending email (in production, integrate with email service like SendGrid, AWS SES, etc.)
async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  console.log(`📧 Email Simulation: Sending code ${code} to ${email}`)
  console.log(`🔑 VERIFICATION CODE FOR ${email}: ${code}`)
  console.log(`📋 Copy this code: ${code}`)
  console.log(`⏰ Code expires in 10 minutes`)
  
  // In production: await emailService.send({
  //   to: email,
  //   subject: 'Solana Wallet - Email Verification Code',
  //   html: `Your verification code is: <strong>${code}</strong><br/>This code will expire in 10 minutes.`
  // })
  
  return true
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, type = 'signin' } = req.body

    console.log('📧 Send Gmail Code Request:', { email, type })

    if (!email) {
      console.log('❌ No email provided')
      return res.status(400).json({ error: 'Email address is required' })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      console.log('❌ Invalid email format:', email)
      return res.status(400).json({ 
        error: 'Invalid email format', 
        debug: `Received: ${email}` 
      })
    }

    // Check if it's a Gmail address
    if (!isGmailAddress(email)) {
      console.log('❌ Not a Gmail address:', email)
      return res.status(400).json({ 
        error: 'Only Gmail addresses are supported', 
        debug: `Received: ${email}` 
      })
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()
    console.log('📧 Normalized email:', normalizedEmail)

    // Check rate limiting (max 3 attempts per email per 10 minutes)
    const existing = verificationCodes.get(normalizedEmail)
    if (existing && existing.attempts >= 3 && (Date.now() - existing.timestamp) < 10 * 60 * 1000) {
      return res.status(429).json({ 
        error: 'Too many attempts. Please try again in 10 minutes.',
        retryAfter: 10 * 60 * 1000 - (Date.now() - existing.timestamp)
      })
    }

    // Generate and store verification code
    const code = generateCode()
    const timestamp = Date.now()
    
    verificationCodes.set(normalizedEmail, {
      code,
      timestamp,
      attempts: existing ? existing.attempts + 1 : 1
    })

    // Send email (simulated)
    const emailSent = await sendVerificationEmail(normalizedEmail, code)

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' })
    }

    // Clean up expired codes (older than 10 minutes)
    for (const [email, data] of verificationCodes.entries()) {
      if (Date.now() - data.timestamp > 10 * 60 * 1000) {
        verificationCodes.delete(email)
      }
    }

    // In development mode, include the code in the response for easy testing
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    res.status(200).json({ 
      success: true, 
      message: 'Verification code sent to your Gmail address',
      expiresIn: 10 * 60 * 1000, // 10 minutes
      ...(isDevelopment && { 
        devCode: code, 
        devMessage: `Development mode: Your verification code is ${code}` 
      })
    })

  } catch (error) {
    console.error('Send Gmail code error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Export for testing purposes
export { verificationCodes }
