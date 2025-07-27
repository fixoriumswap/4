import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createHash } from 'crypto'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        // Generate deterministic wallet seed from user's Google ID
        const walletSeed = createHash('sha256')
          .update(user.id + process.env.NEXTAUTH_SECRET)
          .digest('hex')
        
        token.walletSeed = walletSeed
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.walletSeed = token.walletSeed as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})
