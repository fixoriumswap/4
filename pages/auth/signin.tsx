import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useLocation, CountryInfo } from '../../hooks/useLocation'

interface AuthState {
  step: 'phone' | 'code'
  phoneNumber: string
  code: string
  loading: boolean
  error: string | null
  countdown: number
  canResend: boolean
  selectedCountry: CountryInfo | null
  showCountryPicker: boolean
}

export default function SignIn() {
  const router = useRouter()
  const { type = 'signin' } = router.query // 'signin' or 'recovery'
  const { location, isLoading: isLocationLoading } = useLocation()

  const [state, setState] = useState<AuthState>({
    step: 'phone',
    phoneNumber: '',
    code: '',
    loading: false,
    error: null,
    countdown: 0,
    canResend: true,
    selectedCountry: null,
    showCountryPicker: false
  })

  const codeInputsRef = useRef<(HTMLInputElement | null)[]>([])
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Set initial country when location is detected
  useEffect(() => {
    if (location && location.countryInfo && !state.selectedCountry) {
      setState(prev => ({ ...prev, selectedCountry: location.countryInfo }))
    }
  }, [location, state.selectedCountry])

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

  const formatPhoneNumber = (value: string) => {
    const phone = value.replace(/\D/g, '')
    if (phone.length <= 3) return phone
    if (phone.length <= 6) return `${phone.slice(0, 3)} ${phone.slice(3)}`
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 10)}`
  }

  const handleCountrySelect = (country: CountryInfo) => {
    setState(prev => ({
      ...prev,
      selectedCountry: country,
      showCountryPicker: false,
      phoneNumber: '' // Clear phone number when country changes
    }))
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!state.phoneNumber.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter your phone number' }))
      return
    }

    if (!state.selectedCountry) {
      setState(prev => ({ ...prev, error: 'Please select a country' }))
      return
    }

    // Check for VPN
    if (location && location.isVPN) {
      setState(prev => ({ ...prev, error: 'Please disable your VPN to continue' }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Format full phone number with country code
      const fullPhoneNumber = `${state.selectedCountry.dialCode}${state.phoneNumber}`

      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          countryCode: state.selectedCountry.code,
          type: type as string
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setState(prev => ({ ...prev, error: data.error, loading: false }))
        return
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
      setState(prev => ({ 
        ...prev, 
        error: 'Network error. Please try again.', 
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

    if (!state.selectedCountry) {
      setState(prev => ({ ...prev, error: 'Country information missing' }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Format full phone number with country code
      const fullPhoneNumber = `${state.selectedCountry.dialCode}${state.phoneNumber}`

      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          countryCode: state.selectedCountry.code,
          code: finalCode,
          type: type as string
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setState(prev => ({ ...prev, error: data.error, loading: false }))
        return
      }

      // Success! Redirect to main app
      router.push('/')

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Network error. Please try again.', 
        loading: false 
      }))
    }
  }

  const handleResendCode = async () => {
    if (!state.canResend) return

    if (!state.selectedCountry) {
      setState(prev => ({ ...prev, error: 'Country information missing' }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Format full phone number with country code
      const fullPhoneNumber = `${state.selectedCountry.dialCode}${state.phoneNumber}`

      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          countryCode: state.selectedCountry.code,
          type: type as string
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setState(prev => ({ ...prev, error: data.error, loading: false }))
        return
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
      setState(prev => ({ 
        ...prev, 
        error: 'Network error. Please try again.', 
        loading: false 
      }))
    }
  }

  const handleBackToPhone = () => {
    setState(prev => ({ 
      ...prev, 
      step: 'phone', 
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
          {state.step === 'phone' ? (
            <>
              <div className="auth-description">
                <h2>
                  {type === 'recovery' ? 'Account Recovery' : 'Welcome to the Future of Finance'}
                </h2>
                <p>
                  {type === 'recovery' 
                    ? 'Enter your mobile number to recover your Solana wallet. We\'ll send you a verification code to restore access.'
                    : 'Create your secure Solana wallet with just your mobile number. No seed phrases to remember, no complex setups.'
                  }
                </p>
              </div>

              {/* VPN Warning */}
              {location && location.isVPN && (
                <div className="vpn-warning">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-content">
                    <h3>VPN Detected</h3>
                    <p>
                      Please disable your VPN to continue. We need to verify your actual location
                      for security and compliance purposes.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="retry-button"
                    >
                      Check Again
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handlePhoneSubmit} className="phone-form">
                <div className="input-group">
                  <label htmlFor="phone">Mobile Number</label>

                  {/* Location Display */}
                  {location && !location.isVPN && (
                    <div className="location-info">
                      <span className="location-icon">📍</span>
                      <span>Detected location: {location.city ? `${location.city}, ` : ''}{location.country}</span>
                    </div>
                  )}

                  <div className="phone-input-container">
                    {/* Country Selector */}
                    <div className="country-selector" onClick={() => setState(prev => ({ ...prev, showCountryPicker: !prev.showCountryPicker }))}>
                      <span className="country-flag">
                        {state.selectedCountry?.flag || '🇺🇸'}
                      </span>
                      <span className="country-code">
                        {state.selectedCountry?.dialCode || '+1'}
                      </span>
                      <span className="dropdown-arrow">▼</span>
                    </div>

                    {/* Country Picker Dropdown */}
                    {state.showCountryPicker && location && (
                      <div className="country-picker">
                        <div className="country-search">
                          <input
                            type="text"
                            placeholder="Search countries..."
                            className="country-search-input"
                          />
                        </div>
                        <div className="country-list">
                          {location.availableCountries.map((country) => (
                            <div
                              key={country.code}
                              className="country-option"
                              onClick={() => handleCountrySelect(country)}
                            >
                              <span className="country-flag-option">{country.flag}</span>
                              <span className="country-name">{country.name}</span>
                              <span className="country-dial-code">{country.dialCode}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <input
                      id="phone"
                      type="tel"
                      value={formatPhoneNumber(state.phoneNumber)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        if (value.length <= 15) { // Increased length for international numbers
                          setState(prev => ({ ...prev, phoneNumber: value, error: null }))
                        }
                      }}
                      placeholder="Enter your mobile number"
                      className="phone-input"
                      disabled={state.loading || (location && location.isVPN)}
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
                  disabled={
                    state.loading ||
                    state.phoneNumber.length < 7 ||
                    (location && location.isVPN) ||
                    isLocationLoading
                  }
                >
                  {isLocationLoading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Detecting Location...</span>
                    </>
                  ) : state.loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Sending Code...</span>
                    </>
                  ) : location && location.isVPN ? (
                    <>
                      <span className="button-icon">🚫</span>
                      <span>Please Disable VPN</span>
                    </>
                  ) : (
                    <>
                      <span className="button-icon">📱</span>
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
                    <p>SMS verification for secure access</p>
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
                <h2>Enter Verification Code</h2>
                <p>
                  We've sent a 6-digit code to <strong>
                    {state.selectedCountry?.flag} {state.selectedCountry?.dialCode} {formatPhoneNumber(state.phoneNumber)}
                  </strong>.
                  Enter the code below to {type === 'recovery' ? 'recover your account' : 'create your wallet'}.
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
                    onClick={handleBackToPhone}
                    className="back-button"
                    disabled={state.loading}
                  >
                    ← Change Phone Number
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
            Your wallet keys are generated securely from your mobile number.
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

        .vpn-warning {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%);
          border: 2px solid #fca5a5;
          border-radius: 16px;
          margin-bottom: 32px;
          animation: warningPulse 2s ease-in-out infinite;
        }

        @keyframes warningPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        .warning-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .warning-content {
          flex: 1;
        }

        .warning-content h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 700;
          color: #dc2626;
        }

        .warning-content p {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #991b1b;
          line-height: 1.5;
        }

        .retry-button {
          padding: 8px 16px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .retry-button:hover {
          background: #b91c1c;
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

        .phone-form, .code-form {
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

        .location-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
          color: #6b7280;
        }

        .location-icon {
          font-size: 14px;
        }

        .phone-input-container {
          display: flex;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          overflow: visible;
          transition: border-color 0.3s ease;
          position: relative;
        }

        .phone-input-container:focus-within {
          border-color: #667eea;
        }

        .country-selector {
          background: #f9fafb;
          padding: 16px 12px;
          border-right: 1px solid #e5e7eb;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.3s ease;
          min-width: 80px;
        }

        .country-selector:hover {
          background: #f3f4f6;
        }

        .country-flag {
          font-size: 18px;
        }

        .country-code {
          font-size: 14px;
        }

        .dropdown-arrow {
          font-size: 10px;
          color: #9ca3af;
          transition: transform 0.3s ease;
        }

        .country-picker {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-height: 300px;
          overflow: hidden;
          margin-top: 4px;
        }

        .country-search {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .country-search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }

        .country-search-input:focus {
          border-color: #667eea;
        }

        .country-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .country-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .country-option:hover {
          background: #f9fafb;
        }

        .country-flag-option {
          font-size: 18px;
          width: 24px;
        }

        .country-name {
          flex: 1;
          font-size: 14px;
          color: #374151;
        }

        .country-dial-code {
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
        }

        .phone-input {
          flex: 1;
          padding: 16px;
          border: none;
          font-size: 16px;
          background: transparent;
          outline: none;
        }

        .phone-input::placeholder {
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
