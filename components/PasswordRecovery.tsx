import React, { useState } from 'react';
import { useFixoriumWallet } from '../context/FixoriumWallet';

interface PasswordRecoveryProps {
  onSuccess: () => void;
  onBackToSignIn: () => void;
}

export default function PasswordRecovery({ onSuccess, onBackToSignIn }: PasswordRecoveryProps) {
  const { recoverPassword, resetPassword, verifyMobileCode, loading } = useFixoriumWallet();
  
  const [step, setStep] = useState<'mobile' | 'verification' | 'newPassword'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [sentCode, setSentCode] = useState('');

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mobileNumber || mobileNumber.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }

    const result = await recoverPassword(mobileNumber);

    if (result.success) {
      setSentCode(result.verificationCode || '');
      setStep('verification');
    } else {
      setError(result.error || 'Recovery failed');
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setStep('newPassword');
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // First set the new password
    const resetResult = await resetPassword(verificationCode, newPassword);
    
    if (resetResult.success) {
      // Then verify to complete the process
      const verifyResult = await verifyMobileCode(verificationCode);
      
      if (verifyResult.success) {
        onSuccess();
      } else {
        setError(verifyResult.error || 'Password reset failed');
      }
    } else {
      setError(resetResult.error || 'Password reset failed');
    }
  };

  if (step === 'newPassword') {
    return (
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <div className="fixorium-brand">
              <svg viewBox="0 0 64 64" className="brand-logo">
                <circle cx="32" cy="32" r="32" fill="#29D6B6"/>
                <text x="32" y="42" textAnchor="middle" fontSize="28" fill="#23272F" fontFamily="Arial" fontWeight="bold">F</text>
              </svg>
              <h1>NEW PASSWORD</h1>
            </div>
            <p className="auth-subtitle">Set your new password</p>
          </div>

          <form onSubmit={handlePasswordReset} className="auth-form">
            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                className="auth-input"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
                required
              />
            </div>

            <div className="input-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Confirm new password"
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
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
              
              <button
                type="button"
                className="auth-button secondary"
                onClick={() => setStep('verification')}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
            <p className="auth-subtitle">Enter the verification code sent to your mobile</p>
          </div>

          <form onSubmit={handleVerificationSubmit} className="auth-form">
            <div className="verification-info">
              <p>Verification code sent to:</p>
              <p className="mobile-display">{mobileNumber}</p>
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
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (error) setError('');
                }}
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
                disabled={verificationCode.length !== 6}
              >
                Verify Code
              </button>
              
              <button
                type="button"
                className="auth-button secondary"
                onClick={() => setStep('mobile')}
              >
                Back
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
            <h1>RECOVER PASSWORD</h1>
          </div>
          <p className="auth-subtitle">Enter your mobile number to recover your account</p>
        </div>

        <form onSubmit={handleMobileSubmit} className="auth-form">
          <div className="input-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              className="auth-input"
              value={mobileNumber}
              onChange={(e) => {
                setMobileNumber(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter your mobile number (with country code)"
              required
            />
            <div className="input-hint">
              <p>Enter the full mobile number including country code (e.g., +1234567890)</p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="auth-buttons">
            <button
              type="submit"
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
            
            <button
              type="button"
              className="auth-button secondary"
              onClick={onBackToSignIn}
            >
              Back to Sign In
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <div className="recovery-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <p>A verification code will be sent to your registered mobile number.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
