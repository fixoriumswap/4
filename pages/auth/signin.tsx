import React from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function SignIn() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { 
        callbackUrl: '/',
        redirect: true 
      })
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 64 64" className="logo-svg">
              <defs>
                <linearGradient id="authLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4285f4" />
                  <stop offset="25%" stopColor="#ea4335" />
                  <stop offset="50%" stopColor="#fbbc04" />
                  <stop offset="75%" stopColor="#34a853" />
                  <stop offset="100%" stopColor="#9c27b0" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="28" fill="url(#authLogoGradient)" />
              <path
                d="M20 28 L32 18 L44 28 L44 38 L32 48 L20 38 Z"
                fill="white"
                opacity="0.9"
              />
              <circle cx="32" cy="33" r="8" fill="url(#authLogoGradient)" />
            </svg>
          </div>
          <h1 className="auth-title">Solana Wallet</h1>
          <p className="auth-subtitle">Secure, Modern, Decentralized</p>
        </div>

        <div className="auth-content">
          <div className="auth-description">
            <h2>Welcome to the Future of Finance</h2>
            <p>
              Create your secure Solana wallet with just your Gmail account. 
              No seed phrases to remember, no complex setups.
            </p>
          </div>

          <div className="auth-features">
            <div className="feature-grid">
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <h3>Secure Login</h3>
                <p>OAuth 2.0 authentication with Google</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <h3>Lightning Fast</h3>
                <p>Instant wallet creation and access</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🌐</div>
                <h3>Cross-Platform</h3>
                <p>Works on all devices and browsers</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">💎</div>
                <h3>Full DeFi Access</h3>
                <p>Swap, stake, and manage all Solana tokens</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="google-signin-button"
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-security">
            <div className="security-badge">
              <span className="security-icon">🛡️</span>
              <div className="security-text">
                <strong>Bank-Level Security</strong>
                <p>Your keys are generated securely and never stored on our servers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Your wallet keys are generated deterministically from your Google account.
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .auth-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
          animation: backgroundShift 10s ease-in-out infinite;
        }

        @keyframes backgroundShift {
          0%, 100% { transform: translateX(0) translateY(0); }
          33% { transform: translateX(-20px) translateY(-10px); }
          66% { transform: translateX(20px) translateY(10px); }
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          padding: 48px;
          max-width: 520px;
          width: 100%;
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 16px 32px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          position: relative;
          z-index: 1;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .auth-logo {
          margin: 0 auto 24px;
          width: 80px;
          height: 80px;
        }

        .logo-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1));
          animation: logoFloat 3s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }

        .auth-title {
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
        }

        .auth-content {
          margin-bottom: 32px;
        }

        .auth-description {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-description h2 {
          margin: 0 0 16px 0;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }

        .auth-description p {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
          line-height: 1.6;
        }

        .auth-features {
          margin-bottom: 40px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .feature-item {
          text-align: center;
          padding: 20px;
          background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .feature-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          font-size: 32px;
          margin-bottom: 12px;
          display: block;
        }

        .feature-item h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .feature-item p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
        }

        .google-signin-button {
          width: 100%;
          padding: 18px 24px;
          background: #fff;
          border: 2px solid #dadce0;
          border-radius: 16px;
          color: #3c4043;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
          position: relative;
          overflow: hidden;
        }

        .google-signin-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
          transition: left 0.5s ease;
        }

        .google-signin-button:hover::before {
          left: 100%;
        }

        .google-signin-button:hover {
          border-color: #4285f4;
          box-shadow: 0 8px 24px rgba(66, 133, 244, 0.2);
          transform: translateY(-2px);
        }

        .google-icon {
          width: 24px;
          height: 24px;
        }

        .auth-security {
          margin-bottom: 24px;
        }

        .security-badge {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%);
          border-radius: 16px;
          border: 1px solid #a7f3d0;
        }

        .security-icon {
          font-size: 24px;
        }

        .security-text strong {
          display: block;
          color: #065f46;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .security-text p {
          margin: 0;
          color: #047857;
          font-size: 12px;
          line-height: 1.4;
        }

        .auth-footer {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .auth-footer p {
          margin: 0;
          color: #9ca3af;
          font-size: 12px;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .auth-card {
            padding: 32px 24px;
            margin: 16px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .auth-title {
            font-size: 28px;
          }

          .auth-description h2 {
            font-size: 20px;
          }

          .security-badge {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  )
}
