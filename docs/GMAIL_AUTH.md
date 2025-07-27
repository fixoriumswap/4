# 📧 Gmail Authentication System

## 🚀 Overview

The Solana Wallet now uses Gmail-based authentication instead of mobile phone verification. Users sign in with their Gmail address, receive a verification code via email, and can access their deterministic wallet.

## 🔧 How It Works

### 1. Email Verification Flow
1. User enters their Gmail address
2. System sends 6-digit verification code to email
3. User copies code from Gmail and pastes it
4. System verifies code and creates wallet session
5. User accesses main wallet functionality

### 2. Wallet Generation
- **Deterministic**: Wallet is generated from Gmail address + server secret
- **Secure**: Same wallet is restored every time with the same Gmail
- **No Seed Phrases**: No need to remember or store seed phrases

## 📱 User Experience

### Sign In Process
1. **Visit Homepage**: Click "Sign in with Gmail"
2. **Enter Email**: Type your Gmail address (only @gmail.com supported)
3. **Check Email**: Look for verification code in Gmail inbox
4. **Enter Code**: Copy 6-digit code and paste in app
5. **Access Wallet**: Immediately access full wallet functionality

### Account Recovery
1. **Visit Recovery**: Go to signin page with `?type=recovery`
2. **Same Process**: Enter same Gmail address used before
3. **Verify Code**: Enter verification code from email
4. **Wallet Restored**: Access same wallet with all previous data

## 🔒 Security Features

### Email Validation
- **Gmail Only**: Only @gmail.com addresses accepted
- **Format Check**: Validates proper email format
- **Normalization**: Converts to lowercase and trims whitespace

### Rate Limiting
- **Max 3 Attempts**: Per email address per 10 minutes
- **Code Expiration**: Verification codes expire in 10 minutes
- **Automatic Cleanup**: Expired codes automatically removed

### Session Security
- **JWT Tokens**: Secure session management with JSON Web Tokens
- **HttpOnly Cookies**: Session cookies not accessible via JavaScript
- **30-Day Expiry**: Sessions expire after 30 days

## 🛠️ API Endpoints

### Send Verification Code
```
POST /api/auth/send-gmail-code
Content-Type: application/json

{
  "email": "user@gmail.com",
  "type": "signin" // or "recovery"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification code sent to your Gmail address",
  "expiresIn": 600000,
  "devCode": "123456", // Only in development
  "devMessage": "Development mode: Your verification code is 123456"
}
```

### Verify Code
```
POST /api/auth/verify-gmail-code
Content-Type: application/json

{
  "email": "user@gmail.com",
  "code": "123456",
  "type": "signin"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully signed in with Gmail",
  "user": {
    "email": "user@gmail.com",
    "walletSeed": "abc123..."
  },
  "sessionToken": "jwt-token-here"
}
```

### Check Session
```
GET /api/auth/session
```

**Response (Valid Session):**
```json
{
  "user": {
    "email": "user@gmail.com",
    "walletSeed": "abc123..."
  },
  "isValid": true
}
```

### Logout
```
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

## 💻 Development Mode

### Code Display
In development mode (`NODE_ENV=development`):
- **Console Logging**: Code logged to browser and server console
- **Visual Notification**: Green popup showing verification code
- **API Response**: Code included in API response for easy testing

### Testing
1. **Main App**: Use normal signin flow with any Gmail address
2. **Test Page**: Visit `/test-gmail` for isolated testing
3. **Console**: Check browser console for verification codes
4. **Server Logs**: Check server console for detailed debugging

## 🎯 Production Deployment

### Email Service Integration
For production, replace the simulated email sending with real service:

```typescript
// In pages/api/auth/send-gmail-code.ts
async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  // Replace with actual email service
  return await emailService.send({
    to: email,
    subject: 'Solana Wallet - Email Verification Code',
    html: `
      <h2>Your Solana Wallet Verification Code</h2>
      <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 2px;">${code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `
  })
}
```

### Recommended Email Services
- **SendGrid**: Popular, reliable email delivery
- **AWS SES**: Cost-effective for high volume
- **Mailgun**: Developer-friendly API
- **Postmark**: Transactional email specialist

### Environment Variables
```bash
# Required
NEXTAUTH_SECRET=your-super-secret-jwt-key

# Email Service (choose one)
SENDGRID_API_KEY=your-sendgrid-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
MAILGUN_API_KEY=your-mailgun-key
```

## 🔧 Technical Implementation

### Wallet Generation
```typescript
// Deterministic wallet from Gmail
function generateWalletSeed(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET
  return createHash('sha256')
    .update(email + secret + 'solana-gmail-wallet')
    .digest('hex')
}
```

### Session Management
```typescript
// JWT token with wallet seed
const payload = {
  email,
  walletSeed,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
}
```

### Client Integration
```typescript
// React context for wallet state
const { 
  user,           // { email, walletSeed }
  publicKey,      // Solana public key
  keypair,        // Solana keypair for signing
  isConnected,    // Boolean connection status
  signInWithGmail,// Function to start signin
  signOutWallet   // Function to logout
} = useWalletContext()
```

## 📱 Mobile Responsive

### Adaptive Design
- **Mobile First**: Optimized for mobile devices
- **Touch Friendly**: Large buttons and inputs
- **Email Integration**: Deep links work with Gmail app
- **Copy/Paste**: Easy code copying from email

## 🔍 Troubleshooting

### Common Issues

**"Only Gmail addresses are supported"**
- Solution: Make sure email ends with @gmail.com

**"Invalid email format"**
- Solution: Check email format (e.g., user@gmail.com)

**"Too many attempts"**
- Solution: Wait 10 minutes or use different email

**"Verification code has expired"**
- Solution: Request new code (codes expire in 10 minutes)

**"No verification code found"**
- Solution: Request new code or check if email is correct

### Development Testing
1. Visit `/test-gmail` for isolated testing
2. Check browser console for verification codes
3. Check server logs for detailed debugging
4. Use any Gmail address for testing

### Debug Logs
```javascript
// Browser console shows:
📧 Sending Gmail verification request: {email: "test@gmail.com", type: "signin"}
📡 API Response status: 200
🔑 Verification Code: 123456

// Server console shows:
📧 Send Gmail Code Request: { email: 'test@gmail.com', type: 'signin' }
📧 Normalized email: test@gmail.com
📧 Email Simulation: Sending code 123456 to test@gmail.com
🔑 VERIFICATION CODE FOR test@gmail.com: 123456
```

## 🚀 Advantages Over Mobile

### Better User Experience
- **No Country Codes**: No need to select countries
- **No Phone Validation**: Simpler than phone number formats
- **Email Integration**: Works with existing Gmail workflow
- **Cross-Device**: Access from any device with Gmail

### Enhanced Security
- **Email Verification**: More secure than SMS (no SIM swapping)
- **Deterministic**: Same wallet always restored
- **Session Management**: Proper JWT-based sessions

### Simplified Flow
1. **One Input**: Just Gmail address
2. **Check Email**: Natural Gmail workflow
3. **Copy Code**: Simple copy/paste
4. **Access Wallet**: Immediate access

The Gmail authentication system provides a more secure, user-friendly, and reliable way to access Solana wallets! 🚀
