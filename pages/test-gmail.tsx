import React, { useState } from 'react'

export default function TestGmail() {
  const [email, setEmail] = useState('test@gmail.com')
  const [verificationCode, setVerificationCode] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testSendCode = async () => {
    setLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/auth/send-gmail-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type: 'signin'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ Success: ${data.message}${data.devCode ? ` | Code: ${data.devCode}` : ''}`)
        if (data.devCode) {
          setVerificationCode(data.devCode)
        }
      } else {
        setResult(`❌ Error: ${data.error}${data.debug ? ` | Debug: ${data.debug}` : ''}`)
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testVerifyCode = async () => {
    setLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/auth/verify-gmail-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: verificationCode,
          type: 'signin'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ Verification Success: ${data.message}`)
      } else {
        setResult(`❌ Verification Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>📧 Gmail Verification Test</h1>
      <p>This page helps test the Gmail verification system in development mode.</p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Gmail Address:
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '10px', 
            border: '1px solid #ccc', 
            borderRadius: '5px',
            marginBottom: '10px'
          }}
          placeholder="your.email@gmail.com"
        />
      </div>

      <button
        onClick={testSendCode}
        disabled={loading}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginRight: '10px',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Sending...' : '📤 Send Verification Code'}
      </button>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Verification Code:
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '10px', 
            border: '1px solid #ccc', 
            borderRadius: '5px',
            marginBottom: '10px'
          }}
          placeholder="Enter 6-digit code"
        />
      </div>

      <button
        onClick={testVerifyCode}
        disabled={loading || !verificationCode}
        style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '5px',
          cursor: loading || !verificationCode ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Verifying...' : '✅ Verify Code'}
      </button>

      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: result.startsWith('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Result:</strong> {result}
        </div>
      )}

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px',
        marginTop: '30px'
      }}>
        <h3>📋 How to Test:</h3>
        <ol>
          <li>Enter a Gmail address (e.g., test@gmail.com)</li>
          <li>Click "Send Verification Code"</li>
          <li>In development mode, the code will be shown in the result</li>
          <li>Copy the code and click "Verify Code"</li>
          <li>Success! You can now access the main wallet</li>
        </ol>
        
        <p><strong>Note:</strong> Check the browser console and server logs for detailed debugging information.</p>
      </div>

      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '15px', 
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <h3>🔍 Common Issues:</h3>
        <ul>
          <li><strong>Not a Gmail address:</strong> Only @gmail.com addresses are supported</li>
          <li><strong>Invalid email format:</strong> Make sure the email format is correct</li>
          <li><strong>Rate limiting:</strong> Max 3 attempts per email per 10 minutes</li>
        </ul>
      </div>
    </div>
  )
}
