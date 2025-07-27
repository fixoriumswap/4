import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { FixoriumWalletProvider } from '../context/FixoriumWallet'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <FixoriumWalletProvider>
      <Component {...pageProps} />
    </FixoriumWalletProvider>
  );
}
