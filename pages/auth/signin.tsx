import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

interface AuthState {
  step: 'email' | 'code'
  email: string
  code: string
  loading: boolean
  error: string | null
  countdown: number
  canResend: boolean
}

export default function SignIn() {
  const router = useRouter()
  const { type = 'signin' } = router.query // 'signin' or 'recovery'
  
  const [state, setState] = useState<AuthState>({
    step: 'email',
    email: '',
    code: '',
    loading: false,
    error: null,
    countdown: 0,
    canResend: true
  })

  const codeInputsRef = useRef<(HTMLInputElement | null)[]>([])
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Check if user is already authenticated
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.isValid) {
          router.push('/')
        }
      })
      .catch(() => {
        // Not authenticated, stay on signin page
      })
  }, [router])

  // Countdown timer for resend
  useEffect(() => {
    if (state.countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, countdown: prev.countdown - 1 }))
      }, 1000)
    } else if (state.countdown === 0 && !state.canResend) {
      setState(prev => ({ ...prev, canResend: true }))
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
      }
    }
  }, [state.countdown, state.canResend])

  // Utility function to show development verification code
  const showDevelopmentCode = (code: string) => {
    console.log(`🔑 Verification Code: ${code}`)
    
    // Create a more visible notification
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div style="
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: #28a745; 
        color: white; 
        padding: 20px; 
        border-radius: 10px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: monospace;
        font-size: 16px;
        font-weight: bold;
        max-width: 300px;
      ">
        🔑 DEVELOPMENT MODE<br/>
        Your verification code is:<br/>
        <span style="font-size: 24px; letter-spacing: 2px;">${code}</span><br/>
        <small>Copy this code to verify</small>
      </div>
    `
    document.body.appendChild(notification)
    
    // Remove notification after 15 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 15000)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!state.email.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter your Gmail address' }))
      return
    }

    // Basic Gmail validation
    if (!state.email.toLowerCase().endsWith('@gmail.com')) {
      setState(prev => ({ ...prev, error: 'Please enter a valid Gmail address' }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      console.log('📧 Sending Gmail verification request:', {
        email: state.email,
        type: type as string
      })

      const response = await fetch('/api/auth/send-gmail-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          type: type as string
        }),
        // Add timeout and better error handling
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })

      console.log('📡 API Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }))
        setState(prev => ({ ...prev, error: errorData.error || 'Server error', loading: false }))
        return
      }

      const data = await response.json()

      // Show development verification code if available
      if (data.devCode) {
        showDevelopmentCode(data.devCode)
      }

      setState(prev => ({
        ...prev,
        step: 'code',
        loading: false,
        countdown: 60,
        canResend: false
      }))

      // Focus first code input
      setTimeout(() => {
        codeInputsRef.current[0]?.focus()
      }, 100)

    } catch (error) {
      console.error('Email submission error:', error)
      const errorMessage = error instanceof Error
        ? error.name === 'AbortError'
          ? 'Request timed out. Please check your connection and try again.'
          : 'Network error. Please check your connection and try again.'
        : 'Network error. Please try again.'

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }))
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newCode = state.code.split('')
    newCode[index] = value
    const updatedCode = newCode.join('')

    setState(prev => ({ ...prev, code: updatedCode, error: null }))

    // Auto-focus next input
    if (value && index < 5) {
      codeInputsRef.current[index + 1]?.focus()
    }

    // Auto-submit if code is complete
    if (updatedCode.length === 6 && !updatedCode.includes('')) {
      handleCodeSubmit(updatedCode)
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !state.code[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus()
    }
  }

  const handleCodeSubmit = async (codeToSubmit?: string) => {
    const finalCode = codeToSubmit || state.code

    if (finalCode.length !== 6) {
      setState(prev => ({ ...prev, error: 'Please enter the complete 6-digit code' }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch('/api/auth/verify-gmail-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          code: finalCode,
          type: type as string
        }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Verification failed' }))
        setState(prev => ({ ...prev, error: errorData.error || 'Verification failed', loading: false }))
        return
      }

      const data = await response.json()

      // Success! Redirect to main app
      router.push('/')

    } catch (error) {
      console.error('Code verification error:', error)
      const errorMessage = error instanceof Error
        ? error.name === 'AbortError'
          ? 'Verification timed out. Please try again.'
          : 'Network error. Please check your connection and try again.'
        : 'Network error. Please try again.'

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }))
    }
  }

  const handleResendCode = async () => {
    if (!state.canResend) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      console.log('🔄 Resending Gmail verification request:', {
        email: state.email,
        type: type as string
      })

      const response = await fetch('/api/auth/send-gmail-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          type: type as string
        }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })

      console.log('📡 Resend API Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to resend code' }))
        setState(prev => ({ ...prev, error: errorData.error || 'Failed to resend code', loading: false }))
        return
      }

      const data = await response.json()

      // Show development verification code if available
      if (data.devCode) {
        showDevelopmentCode(data.devCode)
      }

      setState(prev => ({
        ...prev,
        loading: false,
        countdown: 60,
        canResend: false,
        code: ''
      }))

      // Clear and focus first input
      codeInputsRef.current.forEach(input => {
        if (input) input.value = ''
      })
      codeInputsRef.current[0]?.focus()

    } catch (error) {
      console.error('Resend code error:', error)
      const errorMessage = error instanceof Error
        ? error.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : 'Network error. Please check your connection and try again.'
        : 'Network error. Please try again.'

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }))
    }
  }

  const handleBackToEmail = () => {
    setState(prev => ({ 
      ...prev, 
      step: 'email', 
      code: '', 
      error: null,
      countdown: 0,
      canResend: true
    }))
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
          <p className="auth-subtitle">
            {type === 'recovery' ? 'Recover Your Account' : 'Secure, Modern, Decentralized'}
          </p>
        </div>

        <div className="auth-content">
          {state.step === 'email' ? (
            <>
              <div className="auth-description">
                <h2>
                  {type === 'recovery' ? 'Account Recovery' : 'Welcome to the Future of Finance'}
                </h2>
                <p>
                  {type === 'recovery' 
                    ? 'Enter your Gmail address to recover your Solana wallet. We\'ll send you a verification code to restore access.'
                    : 'Create your secure Solana wallet with just your Gmail address. We\'ll send a verification code to your email.'
                  }
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="email-form">
                <div className="input-group">
                  <label htmlFor="email">Gmail Address</label>
                  <div className="email-input-container">
                    <div className="email-icon">
                      <svg viewBox="0 0 24 24" className="gmail-icon">
                        <path fill="currentColor" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.5 4.64L12 9.548l6.5-4.908 1.573-1.147C21.69 2.28 24 3.434 24 5.457z"/>
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={state.email}
                      onChange={(e) => setState(prev => ({ ...prev, email: e.target.value, error: null }))}
                      placeholder="your.email@gmail.com"
                      className="email-input"
                      disabled={state.loading}
                    />
                  </div>
                </div>

                {state.error && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {state.error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={state.loading || !state.email.includes('@gmail.com')}
                >
                  {state.loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span className="button-icon">📧</span>
                      <span>{type === 'recovery' ? 'Send Recovery Code' : 'Send Verification Code'}</span>
                    </>
                  )}
                </button>
              </form>

              <div className="auth-features">
                <div className="feature-grid">
                  <div className="feature-item">
                    <div className="feature-icon">🔒</div>
                    <h3>Secure Login</h3>
                    <p>Gmail verification for secure access</p>
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
            </>
          ) : (
            <>
              <div className="auth-description">
                <h2>Check Your Gmail</h2>
                <p>
                  We've sent a 6-digit verification code to <strong>{state.email}</strong>. 
                  Check your Gmail inbox and enter the code below to {type === 'recovery' ? 'recover your account' : 'create your wallet'}.
                </p>
              </div>

              <div className="code-form">
                <div className="code-inputs">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => codeInputsRef.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={state.code[index] || ''}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="code-input"
                      disabled={state.loading}
                    />
                  ))}
                </div>

                {state.error && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {state.error}
                  </div>
                )}

                <div className="code-actions">
                  <button
                    type="button"
                    onClick={() => handleCodeSubmit()}
                    disabled={state.loading || state.code.length !== 6}
                    className="submit-button"
                  >
                    {state.loading ? (
                      <>
                        <div className="spinner"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span className="button-icon">✅</span>
                        <span>{type === 'recovery' ? 'Recover Account' : 'Verify & Create Wallet'}</span>
                      </>
                    )}
                  </button>

                  <div className="resend-section">
                    {state.countdown > 0 ? (
                      <p className="countdown-text">
                        Resend code in {state.countdown}s
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={state.loading || !state.canResend}
                        className="resend-button"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="back-button"
                    disabled={state.loading}
                  >
                    ← Change Email Address
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="auth-footer">
          <div className="auth-links">
            {type === 'recovery' ? (
              <button 
                onClick={() => router.push('/auth/signin')} 
                className="link-button"
              >
                Back to Sign In
              </button>
            ) : (
              <button 
                onClick={() => router.push('/auth/signin?type=recovery')} 
                className="link-button"
              >
                Need to recover your account?
              </button>
            )}
          </div>
          <p className="auth-disclaimer">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Your wallet keys are generated securely from your Gmail address.
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

        .email-form, .code-form {
          margin-bottom: 32px;
        }

        .input-group {
          margin-bottom: 24px;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .email-input-container {
          display: flex;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.3s ease;
        }

        .email-input-container:focus-within {
          border-color: #667eea;
        }

        .email-icon {
          background: #f9fafb;
          padding: 16px;
          border-right: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gmail-icon {
          width: 20px;
          height: 20px;
          color: #ea4335;
        }

        .email-input {
          flex: 1;
          padding: 16px;
          border: none;
          font-size: 16px;
          background: transparent;
          outline: none;
        }

        .email-input::placeholder {
          color: #9ca3af;
        }

        .code-inputs {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 24px;
        }

        .code-input {
          width: 48px;
          height: 56px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          text-align: center;
          font-size: 20px;
          font-weight: 600;
          transition: all 0.3s ease;
          outline: none;
        }

        .code-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .code-input:disabled {
          background: #f9fafb;
          opacity: 0.7;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .error-icon {
          font-size: 16px;
        }

        .submit-button {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .button-icon {
          font-size: 18px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .code-actions {
          text-align: center;
        }

        .resend-section {
          margin: 16px 0;
        }

        .countdown-text {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .resend-button, .back-button {
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .resend-button:hover:not(:disabled), .back-button:hover:not(:disabled) {
          background: rgba(102, 126, 234, 0.1);
        }

        .resend-button:disabled, .back-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .back-button {
          margin-top: 16px;
        }

        .auth-features {
          margin-bottom: 32px;
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

        .auth-footer {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .auth-links {
          margin-bottom: 16px;
        }

        .link-button {
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .link-button:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .auth-disclaimer {
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

          .code-inputs {
            gap: 8px;
          }

          .code-input {
            width: 40px;
            height: 48px;
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  )
}
