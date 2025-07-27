export interface CountryInfo {
  code: string
  name: string
  dialCode: string
  flag: string
}

// Popular countries that should appear at the top of the list
export const POPULAR_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'JP', 
  'KR', 'CN', 'IN', 'BR', 'MX', 'RU', 'TR', 'SA', 'AE', 'SG'
]

/**
 * Sort countries with popular ones first, then alphabetically
 */
export function sortCountries(countries: CountryInfo[]): CountryInfo[] {
  return countries.sort((a, b) => {
    const aIsPopular = POPULAR_COUNTRIES.includes(a.code)
    const bIsPopular = POPULAR_COUNTRIES.includes(b.code)
    
    // If both are popular, sort by popularity order
    if (aIsPopular && bIsPopular) {
      return POPULAR_COUNTRIES.indexOf(a.code) - POPULAR_COUNTRIES.indexOf(b.code)
    }
    
    // Popular countries come first
    if (aIsPopular && !bIsPopular) return -1
    if (!aIsPopular && bIsPopular) return 1
    
    // Both are not popular, sort alphabetically
    return a.name.localeCompare(b.name)
  })
}

/**
 * Filter countries by search query
 */
export function filterCountries(countries: CountryInfo[], query: string): CountryInfo[] {
  if (!query.trim()) return countries
  
  const searchQuery = query.toLowerCase().trim()
  
  return countries.filter(country => 
    country.name.toLowerCase().includes(searchQuery) ||
    country.dialCode.includes(searchQuery) ||
    country.code.toLowerCase().includes(searchQuery)
  )
}

/**
 * Find country by ISO code
 */
export function findCountryByCode(countries: CountryInfo[], code: string): CountryInfo | undefined {
  return countries.find(country => country.code.toLowerCase() === code.toLowerCase())
}

/**
 * Find country by dial code
 */
export function findCountryByDialCode(countries: CountryInfo[], dialCode: string): CountryInfo | undefined {
  const normalizedDialCode = dialCode.replace(/^\+/, '')
  return countries.find(country => 
    country.dialCode.replace(/^\+/, '') === normalizedDialCode
  )
}

/**
 * Get countries by region
 */
export function getCountriesByRegion(countries: CountryInfo[]): Record<string, CountryInfo[]> {
  const regions: Record<string, CountryInfo[]> = {
    popular: [],
    africa: [],
    americas: [],
    asia: [],
    europe: [],
    oceania: []
  }

  const AFRICA_CODES = [
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'DJ', 'EG', 'GQ', 
    'ER', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 
    'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'SZ', 
    'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'
  ]

  const AMERICAS_CODES = [
    'AR', 'BS', 'BB', 'BZ', 'BO', 'BR', 'CA', 'CL', 'CO', 'CR', 'CU', 'DM', 'DO', 'EC', 'SV', 'GD', 
    'GT', 'GY', 'HT', 'HN', 'JM', 'MX', 'NI', 'PA', 'PY', 'PE', 'KN', 'LC', 'VC', 'SR', 'TT', 'US', 
    'UY', 'VE'
  ]

  const ASIA_CODES = [
    'AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CY', 'GE', 'IN', 'ID', 'IR', 'IQ', 'IL', 
    'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'OM', 'PK', 'PS', 
    'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE'
  ]

  const EUROPE_CODES = [
    'AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 
    'IS', 'IE', 'IT', 'XK', 'LV', 'LI', 'LT', 'LU', 'MK', 'MT', 'MD', 'MC', 'ME', 'NL', 'NO', 'PL', 
    'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'UA', 'GB', 'VA'
  ]

  const OCEANIA_CODES = [
    'AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'SB', 'TO', 'TV', 'VU', 'WS'
  ]

  countries.forEach(country => {
    if (POPULAR_COUNTRIES.includes(country.code)) {
      regions.popular.push(country)
    }
    
    if (AFRICA_CODES.includes(country.code)) {
      regions.africa.push(country)
    } else if (AMERICAS_CODES.includes(country.code)) {
      regions.americas.push(country)
    } else if (ASIA_CODES.includes(country.code)) {
      regions.asia.push(country)
    } else if (EUROPE_CODES.includes(country.code)) {
      regions.europe.push(country)
    } else if (OCEANIA_CODES.includes(country.code)) {
      regions.oceania.push(country)
    }
  })

  // Sort each region
  Object.keys(regions).forEach(region => {
    if (region === 'popular') {
      regions[region] = sortCountries(regions[region])
    } else {
      regions[region].sort((a, b) => a.name.localeCompare(b.name))
    }
  })

  return regions
}

/**
 * Format phone number for display
 */
export function formatPhoneDisplay(phoneNumber: string, countryCode?: string): string {
  if (!phoneNumber) return ''
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '')
  
  // Basic formatting based on length
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  
  // For longer numbers, format as international
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`
}

/**
 * Validate phone number length for country
 */
export function validatePhoneLength(phoneNumber: string, countryCode: string): boolean {
  const digits = phoneNumber.replace(/\D/g, '')
  
  // Basic validation - most countries have 7-15 digit phone numbers
  const minLength = 7
  const maxLength = 15
  
  // Special cases for specific countries
  const specialCases: Record<string, { min: number, max: number }> = {
    'US': { min: 10, max: 10 },
    'CA': { min: 10, max: 10 },
    'GB': { min: 10, max: 11 },
    'AU': { min: 9, max: 9 },
    'DE': { min: 11, max: 12 },
    'FR': { min: 10, max: 10 },
    'JP': { min: 10, max: 11 },
    'CN': { min: 11, max: 11 },
    'IN': { min: 10, max: 10 },
    'BR': { min: 10, max: 11 },
  }
  
  const countryRules = specialCases[countryCode]
  if (countryRules) {
    return digits.length >= countryRules.min && digits.length <= countryRules.max
  }
  
  return digits.length >= minLength && digits.length <= maxLength
}
