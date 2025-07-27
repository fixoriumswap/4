import React, { useState } from 'react';
import { useFixoriumWallet } from '../context/FixoriumWallet';

interface SignInProps {
  onSuccess: () => void;
  onBackToOptions: () => void;
  onForgotPassword: () => void;
}

export default function SignIn({ onSuccess, onBackToOptions, onForgotPassword }: SignInProps) {
  const { signIn, verifyMobileCode, loading } = useFixoriumWallet();
  
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [userMobile, setUserMobile] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    const result = await signIn(formData.email, formData.password);

    if (result.success && result.requiresVerification) {
      // Get user mobile from stored users to display
      const existingUsers = JSON.parse(localStorage.getItem('fixoriumUsers') || '[]');
      const user = existingUsers.find((u: any) => u.email === formData.email);
      if (user) {
        setUserMobile(user.mobileNumber);
      }
      setStep('verification');
      // In real implementation, the verification code would be sent via SMS
      // For demo purposes, we'll show it in console
    } else if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Sign in failed');
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    const result = await verifyMobileCode(verificationCode);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Verification failed');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  if (step === 'verification') {
    return (
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <div className="fixorium-brand">
              <svg viewBox="0 0 64 64" className="brand-logo">
                <circle cx="32" cy="32" r="32" fill="#29D6B6"/>
                <text x="32" y="42" textAnchor="middle" fontSize="28" fill="#23272F" fontFamily="Arial" fontWeight="bold">F</text>
              </svg>
              <h1>VERIFY LOGIN</h1>
            </div>
            <p className="auth-subtitle">Enter the verification code sent to your mobile</p>
          </div>

          <form onSubmit={handleVerification} className="auth-form">
            <div className="verification-info">
              <p>Verification code sent to:</p>
              <p className="mobile-display">{userMobile}</p>
              <div className="demo-code">
                <p><strong>Check console for demo code</strong></p>
              </div>
            </div>

            <div className="input-group">
              <label>Verification Code</label>
              <input
                type="text"
                className="auth-input verification-input"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="auth-buttons">
              <button
                type="submit"
                className="auth-button primary"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              
              <button
                type="button"
                className="auth-button secondary"
                onClick={() => setStep('form')}
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <div className="fixorium-brand">
            <svg viewBox="0 0 64 64" className="brand-logo">
              <circle cx="32" cy="32" r="32" fill="#29D6B6"/>
              <text x="32" y="42" textAnchor="middle" fontSize="28" fill="#23272F" fontFamily="Arial" fontWeight="bold">F</text>
            </svg>
            <h1>SIGN IN</h1>
          </div>
          <p className="auth-subtitle">Welcome back to Fixorium Wallet</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              className="auth-input"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              className="auth-input"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="auth-buttons">
            <button
              type="submit"
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <button
              type="button"
              className="auth-button secondary"
              onClick={onBackToOptions}
            >
              Back to Options
            </button>
          </div>

          <div className="auth-links">
            <button
              type="button"
              className="link-button"
              onClick={onForgotPassword}
            >
              Forgot Password?
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <div className="security-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <p>Your account is protected with two-factor authentication.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
