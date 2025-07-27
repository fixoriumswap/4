import { NextApiRequest, NextApiResponse } from 'next'
import { createHash } from 'crypto'

// In a real implementation, you would use a service like Twilio, AWS SNS, or similar
// For demo purposes, we'll simulate SMS sending and store codes in memory
const verificationCodes = new Map<string, { code: string, timestamp: number, attempts: number }>()

// Generate a 6-digit verification code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Validate phone number format
function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

// Simulate SMS sending (in production, integrate with SMS service)
async function sendSMS(phone: string, code: string): Promise<boolean> {
  // Enhanced logging for development
  console.log(`📱 SMS Simulation: Sending code ${code} to ${phone}`)
  console.log(`🔑 VERIFICATION CODE FOR ${phone}: ${code}`)
  console.log(`📋 Copy this code: ${code}`)
  console.log(`⏰ Code expires in 10 minutes`)

  // In production: await smsService.send(phone, `Your Solana Wallet verification code is: ${code}`)
  return true
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { phoneNumber, countryCode, type = 'signin' } = req.body

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    if (!countryCode) {
      return res.status(400).json({ error: 'Country code is required' })
    }

    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')

    if (!isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' })
    }

    // Check rate limiting (max 3 attempts per phone per 10 minutes)
    const existing = verificationCodes.get(normalizedPhone)
    if (existing && existing.attempts >= 3 && (Date.now() - existing.timestamp) < 10 * 60 * 1000) {
      return res.status(429).json({ 
        error: 'Too many attempts. Please try again in 10 minutes.',
        retryAfter: 10 * 60 * 1000 - (Date.now() - existing.timestamp)
      })
    }

    // Generate and store verification code
    const code = generateCode()
    const timestamp = Date.now()
    
    verificationCodes.set(normalizedPhone, {
      code,
      timestamp,
      attempts: existing ? existing.attempts + 1 : 1
    })

    // Send SMS (simulated)
    const smsSent = await sendSMS(normalizedPhone, code)

    if (!smsSent) {
      return res.status(500).json({ error: 'Failed to send verification code' })
    }

    // Clean up expired codes (older than 10 minutes)
    for (const [phone, data] of verificationCodes.entries()) {
      if (Date.now() - data.timestamp > 10 * 60 * 1000) {
        verificationCodes.delete(phone)
      }
    }

    // In development mode, include the code in the response for easy testing
    const isDevelopment = process.env.NODE_ENV === 'development'

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: 10 * 60 * 1000, // 10 minutes
      ...(isDevelopment && {
        devCode: code,
        devMessage: `Development mode: Your verification code is ${code}`
      })
    })

  } catch (error) {
    console.error('Send code error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Export for testing purposes
export { verificationCodes }
