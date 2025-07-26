// Utility to detect Phantom wallet
export function detectPhantomWallet(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if Phantom is installed
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
    window.open('https://phantom.app/', '_blank');
  }
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
