// Utility to detect Phantom wallet
export function detectPhantomWallet(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if Phantom is installed (browser extension)
  const isPhantomInstalled = window.solana && window.solana.isPhantom;

  return !!isPhantomInstalled;
}

export function getPhantomWallet() {
  if (typeof window === 'undefined') return null;

  if (window.solana && window.solana.isPhantom) {
    return window.solana;
  }

  return null;
}

export function openPhantomDownload() {
  if (typeof window !== 'undefined') {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // For mobile, open app store links
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        window.open('https://apps.apple.com/app/phantom-solana-wallet/1598432977', '_blank');
      } else {
        window.open('https://play.google.com/store/apps/details?id=app.phantom', '_blank');
      }
    } else {
      // For desktop, open browser extension page
      window.open('https://phantom.app/', '_blank');
    }
  }
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Extend window type for TypeScript
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect?: () => Promise<any>;
      disconnect?: () => Promise<void>;
      on?: (event: string, callback: () => void) => void;
      publicKey?: any;
    };
  }
}
