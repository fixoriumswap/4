import React, { useState, useEffect } from 'react';

interface SettingsProps {
  onClose: () => void;
  onSlippageChange: (slippage: number) => void;
  currentSlippage: number;
}

export default function Settings({ onClose, onSlippageChange, currentSlippage }: SettingsProps) {
  const [slippage, setSlippage] = useState(currentSlippage);
  const [customSlippage, setCustomSlippage] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const presetSlippages = [0.1, 0.5, 1.0, 2.0, 5.0];

  useEffect(() => {
    const isPreset = presetSlippages.includes(currentSlippage);
    if (!isPreset) {
      setIsCustom(true);
      setCustomSlippage(currentSlippage.toString());
    }
  }, [currentSlippage]);

  const handleSlippageChange = (newSlippage: number) => {
    setSlippage(newSlippage);
    setIsCustom(false);
    setCustomSlippage('');
  };

  const handleCustomSlippageChange = (value: string) => {
    setCustomSlippage(value);
    setIsCustom(true);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      setSlippage(numValue);
    }
  };

  const handleSave = () => {
    let finalSlippage = slippage;
    
    if (isCustom && customSlippage) {
      const customValue = parseFloat(customSlippage);
      if (!isNaN(customValue) && customValue >= 0 && customValue <= 50) {
        finalSlippage = customValue;
      }
    }
    
    onSlippageChange(finalSlippage);
    onClose();
  };

  const getSlippageWarning = (slippageValue: number) => {
    if (slippageValue < 0.1) return { text: 'Very low slippage may cause transaction failures', type: 'warning' };
    if (slippageValue > 5) return { text: 'High slippage may result in significant price impact', type: 'danger' };
    if (slippageValue > 2) return { text: 'Medium slippage tolerance', type: 'warning' };
    return { text: 'Recommended slippage range', type: 'success' };
  };

  const currentWarning = getSlippageWarning(isCustom ? parseFloat(customSlippage) || 0 : slippage);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="setting-section">
            <h3>Slippage Tolerance</h3>
            <p className="setting-description">
              Maximum price difference you're willing to accept for your trade
            </p>

            <div className="slippage-presets">
              {presetSlippages.map((preset) => (
                <button
                  key={preset}
                  className={`preset-btn ${!isCustom && slippage === preset ? 'active' : ''}`}
                  onClick={() => handleSlippageChange(preset)}
                >
                  {preset}%
                </button>
              ))}
            </div>

            <div className="custom-slippage">
              <label>
                <input
                  type="radio"
                  checked={isCustom}
                  onChange={() => setIsCustom(true)}
                />
                Custom
              </label>
              <div className="custom-input-container">
                <input
                  type="number"
                  className="custom-slippage-input"
                  placeholder="Enter custom %"
                  value={customSlippage}
                  onChange={(e) => handleCustomSlippageChange(e.target.value)}
                  min="0"
                  max="50"
                  step="0.1"
                  disabled={!isCustom}
                />
                <span>%</span>
              </div>
            </div>

            <div className="slippage-slider">
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={isCustom ? parseFloat(customSlippage) || 0.5 : slippage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (isCustom) {
                    setCustomSlippage(value.toString());
                  } else {
                    setSlippage(value);
                  }
                }}
                className="slider"
              />
              <div className="slider-labels">
                <span>0.1%</span>
                <span>5%</span>
                <span>10%</span>
              </div>
            </div>

            <div className={`slippage-warning ${currentWarning.type}`}>
              <span className="warning-icon">
                {currentWarning.type === 'success' ? '✅' : 
                 currentWarning.type === 'warning' ? '⚠️' : '❌'}
              </span>
              {currentWarning.text}
            </div>

            <div className="current-slippage">
              Current: <strong>{isCustom ? customSlippage || '0' : slippage}%</strong>
            </div>
          </div>

          <div className="setting-section">
            <h3>Transaction Settings</h3>
            <div className="setting-item">
              <label className="setting-label">
                <input type="checkbox" defaultChecked />
                Auto-refresh quotes every 20 seconds
              </label>
            </div>
            <div className="setting-item">
              <label className="setting-label">
                <input type="checkbox" defaultChecked />
                Show price impact warnings
              </label>
            </div>
            <div className="setting-item">
              <label className="setting-label">
                <input type="checkbox" defaultChecked />
                Enable transaction confirmations
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
