import { NextApiRequest, NextApiResponse } from 'next'
import { verify } from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const sessionToken = req.cookies['gmail-wallet-session']
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'No session found' })
    }

    const secret = process.env.NEXTAUTH_SECRET || 'default-secret'
    
    try {
      const decoded = verify(sessionToken, secret) as any
      
      res.status(200).json({
        user: {
          email: decoded.email,
          walletSeed: decoded.walletSeed
        },
        isValid: true
      })
    } catch (tokenError) {
      // Invalid or expired token
      res.setHeader('Set-Cookie', [
        'gmail-wallet-session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
        'gmail-wallet-email=; Secure; SameSite=Strict; Path=/; Max-Age=0'
      ])
      
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

  } catch (error) {
    console.error('Session validation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
