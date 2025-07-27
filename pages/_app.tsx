import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { WalletProvider as CustomWalletProvider } from '../components/WalletContext';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <CustomWalletProvider>
        <Component {...pageProps} />
      </CustomWalletProvider>
    </SessionProvider>
  );
}
