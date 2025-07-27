interface FetchOptions extends RequestInit {
  retries?: number
  retryDelay?: number
  timeout?: number
}

interface FetchResponse<T = any> {
  data: T | null
  error: string | null
  status: number
  ok: boolean
}

// Enhanced fetch with retry logic and timeout handling
export async function fetchWithRetry<T = any>(
  url: string, 
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 10000,
    ...fetchOptions
  } = options

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      })

      // Make the actual fetch request
      const fetchPromise = fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise])

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Parse response
      let data: T | null = null
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text() as any
      }

      return {
        data,
        error: null,
        status: response.status,
        ok: true
      }

    } catch (error) {
      console.warn(`Fetch attempt ${attempt + 1} failed:`, error)

      // If this is the last attempt, return the error
      if (attempt === retries) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return {
          data: null,
          error: errorMessage,
          status: 0,
          ok: false
        }
      }

      // Wait before retrying (with exponential backoff)
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  return {
    data: null,
    error: 'Maximum retries exceeded',
    status: 0,
    ok: false
  }
}

// Utility function to check if we're in development mode
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// Utility function to safely handle API responses
export function handleApiResponse<T>(response: FetchResponse<T>): T {
  if (!response.ok) {
    throw new Error(response.error || 'API request failed')
  }
  
  if (!response.data) {
    throw new Error('No data received from API')
  }
  
  return response.data
}

// Specific API fetch utility for our auth endpoints
export async function authFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  return fetchWithRetry<T>(url, {
    ...options,
    credentials: 'include', // Include cookies for session management
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}
