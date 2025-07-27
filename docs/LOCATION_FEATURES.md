# Location Detection & VPN Protection

This document explains the auto-detection features for country and VPN detection in the Solana Wallet mobile authentication system.

## 🌍 Country Auto-Detection

### How It Works
1. **IP Geolocation**: When users visit the signin page, their location is automatically detected using their IP address
2. **Country Selection**: The appropriate country and dial code are pre-selected based on their location
3. **Manual Override**: Users can manually change their country using the country picker dropdown

### Supported Countries
The system supports 30+ major countries with their respective dial codes and flag emojis:
- 🇺🇸 United States (+1)
- 🇬🇧 United Kingdom (+44)
- 🇩🇪 Germany (+49)
- 🇯🇵 Japan (+81)
- And many more...

### API Endpoint
```
GET /api/auth/location
```

**Response:**
```json
{
  "country": "United States",
  "countryCode": "US",
  "city": "New York",
  "dialCode": "+1",
  "isVPN": false,
  "countryInfo": {
    "code": "US",
    "name": "United States", 
    "dialCode": "+1",
    "flag": "🇺🇸"
  },
  "availableCountries": [...]
}
```

## 🔒 VPN Detection & Protection

### Why VPN Detection?
- **Security**: Prevents potential fraud and ensures user verification integrity
- **Compliance**: Helps meet regulatory requirements for financial services
- **User Safety**: Ensures users are creating wallets from their actual location

### How VPN Detection Works
1. **ISP Analysis**: Analyzes the Internet Service Provider name for VPN indicators
2. **Datacenter Detection**: Identifies hosting providers and cloud services
3. **Proxy Detection**: Uses multiple IP geolocation services to detect proxies

### VPN Indicators Detected
- Popular VPN providers (NordVPN, ExpressVPN, etc.)
- Cloud hosting services (AWS, Google Cloud, etc.)
- Datacenter IPs
- Known proxy services

### User Experience
When a VPN is detected:
1. **Warning Display**: Clear message asking user to disable VPN
2. **Button Disabled**: Authentication button is disabled until VPN is turned off
3. **Retry Option**: Users can check again after disabling VPN

## 🎨 UI Features

### Country Picker
- **Visual Search**: Flag emojis and country names for easy identification
- **Search Functionality**: Type to search countries by name or dial code
- **Mobile Optimized**: Full-screen modal on mobile devices

### VPN Warning
- **Clear Messaging**: Explains why VPN needs to be disabled
- **Visual Indicators**: Warning icons and colors
- **Action Button**: Easy retry mechanism

## 🔧 Technical Implementation

### Client-Side Hook
```typescript
import { useLocation } from '../hooks/useLocation'

const { location, isLoading, error } = useLocation()

if (location?.isVPN) {
  // Show VPN warning
}
```

### Phone Number Formatting
```typescript
// Automatically includes country code
const fullNumber = `${selectedCountry.dialCode}${phoneNumber}`
```

### Error Handling
- Fallback to default country (US) if geolocation fails
- Graceful degradation when location services are unavailable
- Network error handling with user-friendly messages

## 📱 Mobile Responsiveness

### Adaptive Design
- **Desktop**: Dropdown country picker
- **Mobile**: Full-screen modal for country selection
- **Touch Optimized**: Large touch targets for mobile users

### Performance
- **Lazy Loading**: Country data loaded only when needed
- **Caching**: Location detection cached during session
- **Fast Fallback**: Quick default values if detection fails

## 🛡️ Security Considerations

### Privacy
- **No Storage**: Location data not stored on servers
- **Session Only**: Location info cleared when session ends
- **Minimal Data**: Only country-level information collected

### Reliability
- **Multiple Services**: Uses multiple IP geolocation providers
- **Fallback Logic**: Always provides working defaults
- **Rate Limiting**: Prevents abuse of location detection services

## 🔄 Development & Testing

### Testing VPN Detection
```bash
node demo/vpn-test.js
```

### Environment Variables
```bash
# Optional: Custom location detection service
LOCATION_API_KEY=your-api-key
```

### Production Setup
1. Consider using premium IP geolocation services for better accuracy
2. Implement rate limiting for location API calls
3. Monitor false positive rates for VPN detection
4. Add analytics for country distribution

## 🚀 Future Enhancements

### Potential Improvements
- **Enhanced VPN Detection**: Machine learning-based detection
- **Regional Compliance**: Country-specific verification rules
- **Time Zone Detection**: Automatic timezone selection
- **Language Localization**: UI in user's native language
- **Risk Scoring**: Combined risk assessment based on location factors

### Integration Options
- **Twilio Lookup**: Enhanced phone number validation
- **MaxMind GeoIP**: Professional geolocation service
- **IPinfo**: Comprehensive IP intelligence
- **Custom ML Models**: Train models for specific VPN detection needs
