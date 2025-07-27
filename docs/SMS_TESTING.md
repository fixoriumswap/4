# 📱 SMS Verification Testing Guide

## 🚨 Current Status: FIXED ✅

The SMS verification system has been enhanced for development and testing. Here's how to test it:

## 🔧 Development Mode Features

### Automatic Code Display
In development mode, verification codes are now:
- **Logged to browser console** 📝
- **Displayed in server console** 🖥️
- **Shown in popup notification** 🔔 (Green notification box in top-right corner)

### Enhanced Debugging
- Full request/response logging
- Phone number validation feedback
- Clear error messages with debug info

## 🧪 How to Test SMS Verification

### Method 1: Use the Main App
1. Go to the main app homepage
2. Click "Sign in with Mobile"
3. Select your country from the dropdown
4. Enter a phone number (any number for testing)
5. Click "Send Verification Code"
6. **Look for the green notification box** in the top-right corner
7. Copy the 6-digit code and enter it in the verification form

### Method 2: Use the Test Page
1. Visit `/test-sms` in your browser
2. Enter a phone number with country code (e.g., +1234567890)
3. Enter country code (e.g., US)
4. Click "Send Verification Code"
5. The code will be displayed in the result area
6. Copy and paste it into the verification field
7. Click "Verify Code"

## 📞 Phone Number Format

### ✅ Valid Formats
- `+1234567890` (US number)
- `+447123456789` (UK number)
- `+8613812345678` (China number)
- Any number with country code (+) and 7-15 digits

### ❌ Invalid Formats
- `1234567890` (missing country code)
- `+1234` (too short)
- `+123456789012345678` (too long)

## 🔍 Debugging Tips

### Check Browser Console
```javascript
// You should see logs like:
📱 Sending verification request: {phoneNumber: "+1234567890", countryCode: "US", type: "signin"}
📡 API Response status: 200
🔑 Verification Code: 123456
```

### Check Server Console
```bash
# You should see logs like:
📞 Send Code Request: { phoneNumber: '+1234567890', countryCode: 'US', type: 'signin' }
📱 Normalized phone: +1234567890
📱 SMS Simulation: Sending code 123456 to +1234567890
🔑 VERIFICATION CODE FOR +1234567890: 123456
📋 Copy this code: 123456
⏰ Code expires in 10 minutes
```

### Visual Notification
Look for a **green popup notification** in the top-right corner showing:
```
🔑 DEVELOPMENT MODE
Your verification code is:
123456
Copy this code to verify
```

## 🚫 Common Issues & Solutions

### Issue: "Invalid phone number format"
**Solution**: Ensure phone number starts with `+` and has 7-15 digits total
```
❌ Bad: 1234567890
✅ Good: +1234567890
```

### Issue: "Country code is required"
**Solution**: Make sure you select a country from the dropdown

### Issue: "Too many attempts"
**Solution**: Wait 10 minutes or use a different phone number

### Issue: "No verification code shown"
**Solutions**:
1. Check browser console (F12 → Console tab)
2. Check the green notification popup
3. Check server console/logs
4. Try using the `/test-sms` page

## 🔐 Production vs Development

### Development Mode (Current)
- Codes shown in console and notifications
- No real SMS sent
- Any phone number accepted
- Immediate feedback

### Production Mode (Future)
- Real SMS sent via Twilio/AWS SNS
- No code display
- Proper phone validation
- Rate limiting enforced

## 🛠️ API Endpoints

### Send Code
```
POST /api/auth/send-code
{
  "phoneNumber": "+1234567890",
  "countryCode": "US",
  "type": "signin"
}
```

### Verify Code
```
POST /api/auth/verify-code
{
  "phoneNumber": "+1234567890",
  "countryCode": "US", 
  "code": "123456",
  "type": "signin"
}
```

## 🎯 Test Scenarios

### Scenario 1: New Account Creation
1. Use any valid phone number format
2. Select correct country
3. Send verification code
4. Enter the code from notification/console
5. Should create new wallet account

### Scenario 2: Account Recovery
1. Visit `/auth/signin?type=recovery`
2. Enter same phone number as before
3. Verify with code
4. Should restore existing wallet

### Scenario 3: Rate Limiting
1. Send 3 codes to same number
2. Try to send 4th code
3. Should see "Too many attempts" error

## 📋 Quick Test Checklist

- [ ] Phone number validation works
- [ ] Country selection works
- [ ] Verification code appears in console
- [ ] Green notification shows code
- [ ] Code verification works
- [ ] Account creation succeeds
- [ ] Rate limiting prevents spam

## 🔧 Troubleshooting

If verification still doesn't work:

1. **Clear browser cache** and reload
2. **Check network tab** in dev tools for failed requests
3. **Use test page** `/test-sms` for isolated testing
4. **Check server console** for backend errors
5. **Try different phone number** format

The SMS verification system is now fully functional in development mode! 🚀
