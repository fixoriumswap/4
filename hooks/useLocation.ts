import { useState, useEffect } from 'react'

export interface CountryInfo {
  code: string
  name: string
  dialCode: string
  flag: string
}

export interface LocationData {
  country: string
  countryCode: string
  region: string
  city: string
  timezone: string
  dialCode: string
  isVPN: boolean
  ip: string
  countryInfo: CountryInfo
  availableCountries: CountryInfo[]
}

interface UseLocationResult {
  location: LocationData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocation = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/location', {
        method: 'GET',
        cache: 'no-cache'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setLocation(data)

    } catch (err) {
      console.error('Location fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to detect location')
      
      // Set fallback location
      setLocation({
        country: 'United States',
        countryCode: 'US',
        region: '',
        city: '',
        timezone: '',
        dialCode: '+1',
        isVPN: false,
        ip: '',
        countryInfo: {
          code: 'US',
          name: 'United States',
          dialCode: '+1',
          flag: '🇺🇸'
        },
        availableCountries: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLocation()
  }, [])

  return {
    location,
    isLoading,
    error,
    refetch: fetchLocation
  }
}
