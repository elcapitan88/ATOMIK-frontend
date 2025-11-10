import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDisplayTickers, getContractTicker } from '@/utils/formatting/tickerUtils';
import TradingLabHeader from '../shared/TradingLabHeader';
import { useAccounts } from '@/hooks/useAccounts';
import { useUnifiedStrategies as useStrategies } from '@/hooks/useUnifiedStrategies';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import './StrategyActivation.css';

const StrategyActivation = ({ strategy, onActivate, onBack }) => {
  const { accounts } = useAccounts();
  const { createStrategy } = useStrategies();
  const displayTickers = getDisplayTickers();
  const [webhooks, setWebhooks] = useState([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  
  // Organize tickers by category for better UX
  const organizedTickers = {
    'Popular': [
      { symbol: 'ES', name: 'S&P 500', type: 'E-mini', popular: true },
      { symbol: 'NQ', name: 'NASDAQ', type: 'E-mini', popular: true },
      { symbol: 'SPY', name: 'S&P 500 ETF', type: 'ETF', popular: true },
      { symbol: 'QQQ', name: 'NASDAQ ETF', type: 'ETF', popular: true }
    ],
    'Micro Futures': [
      { symbol: 'MES', name: 'Micro S&P', type: 'Micro', beginner: true },
      { symbol: 'MNQ', name: 'Micro NASDAQ', type: 'Micro', beginner: true },
      { symbol: 'MYM', name: 'Micro Dow', type: 'Micro', beginner: true },
      { symbol: 'M2K', name: 'Micro Russell', type: 'Micro', beginner: true }
    ],
    'Other Markets': [
      { symbol: 'YM', name: 'Dow Jones', type: 'E-mini' },
      { symbol: 'RTY', name: 'Russell 2000', type: 'E-mini' },
      { symbol: 'CL', name: 'Crude Oil', type: 'Commodity' },
      { symbol: 'GC', name: 'Gold', type: 'Commodity' }
    ]
  };

  // Smart defaults based on strategy risk level
  const getSmartDefaults = () => {
    const defaults = {
      'beginner': { ticker: 'MES', quantity: 1 },
      'intermediate': { ticker: 'ES', quantity: 1 },
      'advanced': { ticker: 'NQ', quantity: 1 }
    };
    return defaults[strategy.complexity?.toLowerCase()] || { ticker: 'SPY', quantity: 1 };
  };

  const [config, setConfig] = useState(getSmartDefaults());
  const [selectedAccount, setSelectedAccount] = useState(accounts?.[0]?.account_id || '');
  const [isActivating, setIsActivating] = useState(false);
  const [quantityInput, setQuantityInput] = useState(getSmartDefaults().quantity.toString());

  useEffect(() => {
    if (accounts?.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].account_id);
    }
  }, [accounts, selectedAccount]);

  // Sync quantityInput with config.quantity when config changes
  useEffect(() => {
    setQuantityInput(config.quantity.toString());
  }, [config.quantity]);

  // Load webhooks
  useEffect(() => {
    const loadWebhooks = async () => {
      try {
        setLoadingWebhooks(true);
        const availableWebhooks = await webhookApi.getAllAvailableWebhooks();
        setWebhooks(availableWebhooks);
      } catch (error) {
        console.error('Failed to load webhooks:', error);
      } finally {
        setLoadingWebhooks(false);
      }
    };
    loadWebhooks();
  }, []);

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, Math.min(99, config.quantity + delta));
    setConfig(prev => ({ ...prev, quantity: newQuantity }));
    setQuantityInput(newQuantity.toString());
  };

  const handleQuantityInput = (value) => {
    // Allow empty string temporarily for editing
    setQuantityInput(value);
    
    // Only update config if it's a valid number
    if (value !== '') {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setConfig(prev => ({
          ...prev,
          quantity: Math.max(1, Math.min(99, numValue))
        }));
      }
    }
  };

  const handleQuantityBlur = () => {
    // On blur, ensure we have a valid value
    if (quantityInput === '' || isNaN(parseInt(quantityInput))) {
      setQuantityInput('1');
      setConfig(prev => ({ ...prev, quantity: 1 }));
    } else {
      // Sync the input with the actual config value (in case it was clamped)
      setQuantityInput(config.quantity.toString());
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    handleQuantityChange(delta);
  };

  const handleActivate = async () => {
    if (!selectedAccount || !webhooks.length) return;
    
    setIsActivating(true);
    try {
      // Create the strategy using the API
      const strategyData = {
        strategy_type: 'single',
        webhook_id: webhooks[0].token, // Use first available webhook
        ticker: getContractTicker(config.ticker), // Convert display ticker to contract
        account_id: selectedAccount,
        quantity: config.quantity
      };
      
      // Create strategy via API
      await createStrategy(strategyData);
      
      // Call parent callback with activation details
      await onActivate({
        ticker: config.ticker,
        quantity: config.quantity,
        accountId: selectedAccount,
        webhookId: webhooks[0].token
      });
    } catch (error) {
      console.error('Activation error:', error);
      setIsActivating(false);
    }
  };

  const selectedAccountDetails = accounts?.find(a => a.account_id === selectedAccount);

  return (
    <motion.div 
      className="strategy-activation-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <TradingLabHeader 
        title={`Activate ${strategy.name}`}
        subtitle="Configure your trading parameters"
        step={2}
        totalSteps={2}
        onBack={onBack}
      />

      <div className="activation-content">
        <motion.div 
          className="activation-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Account Selection (if multiple accounts) */}
          {accounts?.length > 1 && (
            <div className="config-section">
              <label className="config-label">Trading Account</label>
              <div className="account-selector">
                {accounts.map(account => (
                  <motion.button
                    key={account.account_id}
                    className={`account-option ${selectedAccount === account.account_id ? 'selected' : ''}`}
                    onClick={() => setSelectedAccount(account.account_id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="account-name">{account.nickname || account.name || account.account_id}</span>
                    <span className="account-broker">{account.broker_id}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Ticker Selection */}
          <div className="config-section">
            <label className="config-label">Select Ticker</label>
            <select
              className="ticker-dropdown"
              value={config.ticker}
              onChange={(e) => setConfig(prev => ({ ...prev, ticker: e.target.value }))}
            >
              <option value="" disabled>Choose a ticker...</option>
              <optgroup label="Popular">
                <option value="ES">ES - S&P 500 E-mini</option>
                <option value="NQ">NQ - NASDAQ E-mini</option>
                <option value="SPY">SPY - S&P 500 ETF</option>
                <option value="QQQ">QQQ - NASDAQ ETF</option>
              </optgroup>
              <optgroup label="Micro Futures (Beginner Friendly)">
                <option value="MES">MES - Micro S&P 500</option>
                <option value="MNQ">MNQ - Micro NASDAQ</option>
                <option value="MYM">MYM - Micro Dow Jones</option>
                <option value="M2K">M2K - Micro Russell 2000</option>
              </optgroup>
              <optgroup label="Other Markets">
                <option value="YM">YM - Dow Jones E-mini</option>
                <option value="RTY">RTY - Russell 2000 E-mini</option>
                <option value="CL">CL - Crude Oil</option>
                <option value="GC">GC - Gold</option>
              </optgroup>
            </select>
          </div>

          {/* Quantity Control */}
          <div className="config-section">
            <label className="config-label">Contracts</label>
            <div className="quantity-control">
              <motion.button 
                className="quantity-button"
                onClick={() => handleQuantityChange(-1)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={config.quantity <= 1}
              >
                −
              </motion.button>
              <input
                type="number"
                className="quantity-input"
                value={quantityInput}
                onChange={(e) => handleQuantityInput(e.target.value)}
                onBlur={handleQuantityBlur}
                onWheel={handleWheel}
                min="1"
                max="99"
                step="1"
                placeholder="1"
              />
              <motion.button 
                className="quantity-button"
                onClick={() => handleQuantityChange(1)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={config.quantity >= 99}
              >
                +
              </motion.button>
            </div>
          </div>

          {/* Summary */}
          <div className="activation-summary">
            <div className="summary-item">
              <span className="summary-label">Strategy</span>
              <span className="summary-value">{strategy.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Account</span>
              <span className="summary-value">
                {selectedAccountDetails?.nickname || selectedAccountDetails?.name || selectedAccount}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Configuration</span>
              <span className="summary-value">{config.ticker} × {config.quantity}</span>
            </div>
            {!loadingWebhooks && !webhooks.length && (
              <div className="summary-item error">
                <span className="summary-label">⚠️ No webhooks available</span>
                <span className="summary-value">Please create a webhook first</span>
              </div>
            )}
          </div>

          {/* Activate Button */}
          <motion.button
            className="activate-network-button"
            onClick={handleActivate}
            disabled={!selectedAccount || isActivating || !webhooks.length || loadingWebhooks}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isActivating ? (
              <span className="activating">Activating...</span>
            ) : (
              <>
                <span className="atomik-icon">⚛️</span>
                <span>Activate Network</span>
              </>
            )}
          </motion.button>

          {/* Helper Text */}
          <p className="helper-text">
            Your strategy will start scanning for opportunities immediately after activation
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StrategyActivation;