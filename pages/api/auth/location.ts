import { NextApiRequest, NextApiResponse } from 'next'

interface LocationData {
  country: string
  countryCode: string
  region: string
  city: string
  timezone: string
  dialCode: string
  isVPN: boolean
  ip: string
}

interface CountryInfo {
  code: string
  name: string
  dialCode: string
  flag: string
}

// Common countries with dial codes
const COUNTRIES: Record<string, CountryInfo> = {
  'US': { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  'CA': { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  'GB': { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  'AU': { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  'DE': { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  'FR': { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  'IT': { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  'ES': { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  'NL': { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  'JP': { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  'KR': { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  'CN': { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  'IN': { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  'BR': { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  'MX': { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  'RU': { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  'TR': { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  'SA': { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  'AE': { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  'SG': { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  'MY': { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  'TH': { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  'VN': { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  'ID': { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  'PH': { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  'ZA': { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  'NG': { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  'EG': { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  'IL': { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  'AR': { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  'CL': { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  'CO': { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
}

// VPN provider indicators
const VPN_INDICATORS = [
  'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'protonvpn',
  'mullvad', 'windscribe', 'tunnelbear', 'hotspot shield', 'purevpn',
  'ipvanish', 'vypr', 'amazon', 'google', 'microsoft', 'digitalocean',
  'vultr', 'linode', 'ovh', 'cloudflare', 'fastly', 'akamai'
]

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const realIP = req.headers['x-real-ip']
  const connectionIP = req.connection?.remoteAddress

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  
  return (realIP as string) || connectionIP || '127.0.0.1'
}

async function detectLocation(ip: string): Promise<Partial<LocationData>> {
  try {
    // Use multiple free IP geolocation services as fallback
    const services = [
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,timezone,isp,org,as,proxy`,
      `https://ipapi.co/${ip}/json/`,
    ]

    for (const serviceUrl of services) {
      try {
        const response = await fetch(serviceUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Solana-Wallet-App/1.0'
          }
        })

        if (!response.ok) continue

        const data = await response.json()

        // Handle ip-api.com response
        if (data.status === 'success' || data.country) {
          const countryCode = data.countryCode || data.country_code || 'US'
          const countryInfo = COUNTRIES[countryCode] || COUNTRIES['US']
          
          // Simple VPN detection based on ISP/org names
          const isp = (data.isp || data.org || '').toLowerCase()
          const isVPN = VPN_INDICATORS.some(indicator => 
            isp.includes(indicator) || 
            data.proxy === true ||
            isp.includes('vpn') ||
            isp.includes('proxy') ||
            isp.includes('hosting') ||
            isp.includes('server') ||
            isp.includes('datacenter')
          )

          return {
            country: data.country || countryInfo.name,
            countryCode,
            region: data.region || data.region_name || '',
            city: data.city || '',
            timezone: data.timezone || '',
            dialCode: countryInfo.dialCode,
            isVPN,
            ip
          }
        }
      } catch (serviceError) {
        console.warn(`Geolocation service failed:`, serviceError)
        continue
      }
    }

    // Fallback to US if all services fail
    return {
      country: 'United States',
      countryCode: 'US',
      region: '',
      city: '',
      timezone: '',
      dialCode: '+1',
      isVPN: false,
      ip
    }

  } catch (error) {
    console.error('Location detection error:', error)
    // Return default US location on error
    return {
      country: 'United States',
      countryCode: 'US',
      region: '',
      city: '',
      timezone: '',
      dialCode: '+1',
      isVPN: false,
      ip
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const clientIP = getClientIP(req)
    const locationData = await detectLocation(clientIP)

    // Add country info
    const countryInfo = COUNTRIES[locationData.countryCode || 'US'] || COUNTRIES['US']

    res.status(200).json({
      ...locationData,
      countryInfo,
      availableCountries: Object.values(COUNTRIES),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Location API error:', error)
    
    // Return fallback data
    res.status(200).json({
      country: 'United States',
      countryCode: 'US',
      region: '',
      city: '',
      timezone: '',
      dialCode: '+1',
      isVPN: false,
      ip: getClientIP(req),
      countryInfo: COUNTRIES['US'],
      availableCountries: Object.values(COUNTRIES),
      timestamp: new Date().toISOString()
    })
  }
}

// Export country data for client-side use
export { COUNTRIES }
