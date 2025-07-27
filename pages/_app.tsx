import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { WalletProvider as MobileWalletProvider } from '../components/WalletContext'
import ErrorBoundary from '../components/ErrorBoundary'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Suppress FullStory and other third-party script errors
    const originalError = console.error
    console.error = (...args) => {
      const errorMessage = args[0]?.toString() || ''

      // Filter out known third-party errors that we can't control
      const thirdPartyErrors = [
        'fullstory.com',
        'Failed to fetch',
        'webpack-hmr',
        'fs.js',
        'Non-Error promise rejection captured'
      ]

      if (thirdPartyErrors.some(error => errorMessage.includes(error))) {
        // Still log to console but don't crash the app
        console.warn('Third-party error (suppressed):', ...args)
        return
      }

      // Log actual app errors normally
      originalError.apply(console, args)
    }

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.toString() || ''

      // Suppress known third-party promise rejections
      if (errorMessage.includes('fullstory') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('fs.js')) {
        console.warn('Third-party promise rejection (suppressed):', event.reason)
        event.preventDefault()
        return
      }

      console.error('Unhandled promise rejection:', event.reason)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      console.error = originalError
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <ErrorBoundary>
      <MobileWalletProvider>
        <Component {...pageProps} />
      </MobileWalletProvider>
    </ErrorBoundary>
  )
}
