import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { WalletProvider as MobileWalletProvider } from '../components/WalletContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MobileWalletProvider>
      <Component {...pageProps} />
    </MobileWalletProvider>
  )
}
