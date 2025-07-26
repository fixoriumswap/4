import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import SendReceive from './SendReceive';
import AIHelpline from './AIHelpline';

export default function BottomBar() {
  const { publicKey } = useWallet();
  const [showSendReceive, setShowSendReceive] = useState(false);
  const [showAIHelpline, setShowAIHelpline] = useState(false);

  const scrollToSwap = () => {
    const swapForm = document.querySelector('.swap-form');
    if (swapForm) {
      swapForm.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="bottom-bar">
        <div className="bottom-bar-content">
          {/* Send/Receive Button */}
          <button 
            className={`bottom-btn send-receive-bottom ${!publicKey ? 'disabled' : ''}`}
            onClick={() => publicKey && setShowSendReceive(true)}
            disabled={!publicKey}
            title={publicKey ? "Send & Receive SOL" : "Connect wallet to send/receive"}
          >
            <div className="btn-icon">💸</div>
            <span>Send/Receive</span>
          </button>

          {/* Trading Button */}
          <button 
            className="bottom-btn trading-bottom"
            onClick={scrollToSwap}
            title="Go to trading interface"
          >
            <div className="btn-icon">🔄</div>
            <span>Trading</span>
          </button>

          {/* 24/7 Support Button */}
          <button 
            className="bottom-btn support-bottom"
            onClick={() => setShowAIHelpline(true)}
            title="24/7 AI Support"
          >
            <div className="btn-icon">🤖</div>
            <span>24/7 Help</span>
          </button>
        </div>

        {/* Connection indicator */}
        <div className="connection-indicator">
          <div className={`connection-dot ${publicKey ? 'connected' : 'disconnected'}`}></div>
          <span className="connection-text">
            {publicKey ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>

      {/* Modals */}
      {showSendReceive && publicKey && (
        <SendReceive onClose={() => setShowSendReceive(false)} />
      )}
      
      {showAIHelpline && (
        <AIHelpline onClose={() => setShowAIHelpline(false)} />
      )}
    </>
  );
}
