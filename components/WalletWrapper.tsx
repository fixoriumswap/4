import React, { useEffect, useState } from 'react';

interface WalletWrapperProps {
  children: React.ReactNode;
}

export default function WalletWrapper({ children }: WalletWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="navbar-right">
        <button className="wallet-adapter-button">
          Loading...
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
