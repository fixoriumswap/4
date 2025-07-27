import React, { useState } from 'react';
import { useFixoriumWallet } from '../context/FixoriumWallet';

interface SignUpProps {
  onSuccess: () => void;
  onBackToOptions: () => void;
}

const countries = [
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'UK', name: 'United Kingdom', dialCode: '+44' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'AE', name: 'UAE', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' }
];

export default function SignUp({ onSuccess, onBackToOptions }: SignUpProps) {
  const { signUp, verifyMobileCode, loading } = useFixoriumWallet();
  
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    country: 'US',
    mobileNumber: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [sentCode, setSentCode] = useState('');

  const selectedCountry = countries.find(c => c.code === formData.country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.mobileNumber) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.mobileNumber.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }

    const fullMobileNumber = `${selectedCountry?.dialCode}${formData.mobileNumber}`;

    const result = await signUp(
      formData.email,
      formData.password,
      formData.country,
      fullMobileNumber
    );

    if (result.success) {
      setSentCode(result.verificationCode || '');
      setStep('verification');
    } else {
      setError(result.error || 'Signup failed');
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
              <h1>VERIFY MOBILE</h1>
            </div>
            <p className="auth-subtitle">Enter the verification code sent to your mobile number</p>
          </div>

          <form onSubmit={handleVerification} className="auth-form">
            <div className="verification-info">
              <p>Verification code sent to:</p>
              <p className="mobile-display">{selectedCountry?.dialCode}{formData.mobileNumber}</p>
              {sentCode && (
                <div className="demo-code">
                  <p><strong>Demo Code:</strong> {sentCode}</p>
                </div>
              )}
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
                {loading ? 'Verifying...' : 'Verify & Create Wallet'}
              </button>
              
              <button
                type="button"
                className="auth-button secondary"
                onClick={() => setStep('form')}
              >
                Back to Form
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
            <h1>CREATE ACCOUNT</h1>
          </div>
          <p className="auth-subtitle">Sign up for your Fixorium Wallet</p>
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
              placeholder="Enter password (min 6 characters)"
              minLength={6}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              className="auth-input"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          <div className="input-group">
            <label>Country</label>
            <select
              className="auth-input"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              required
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.dialCode})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Mobile Number</label>
            <div className="mobile-input-container">
              <span className="country-code">{selectedCountry?.dialCode}</span>
              <input
                type="tel"
                className="auth-input mobile-input"
                value={formData.mobileNumber}
                onChange={(e) => handleInputChange('mobileNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="Enter mobile number"
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="auth-buttons">
            <button
              type="submit"
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <button
              type="button"
              className="auth-button secondary"
              onClick={onBackToOptions}
            >
              Back to Options
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <div className="security-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p>Your wallet will be secured with your email and mobile verification.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
