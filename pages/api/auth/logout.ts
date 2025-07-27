import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Clear session cookies
    res.setHeader('Set-Cookie', [
      'mobile-wallet-session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
      'mobile-wallet-phone=; Secure; SameSite=Strict; Path=/; Max-Age=0'
    ])

    res.status(200).json({ 
      success: true, 
      message: 'Successfully logged out' 
    })

  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
