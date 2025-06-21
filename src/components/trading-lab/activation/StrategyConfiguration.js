import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TradingLabContext } from '../../../contexts/TradingLabContext';
import { AtomikAnimations } from '../shared/AtomikAnimations';
import { TradingLabUtils } from '../shared/TradingLabUtils';

export const StrategyConfiguration = ({ onActivate, coreAccount, satelliteAccounts = [] }) => {
  const { 
    selectedStrategy,
    primaryAccount,
    updateStrategyConfig
  } = useContext(TradingLabContext);
  
  const [selectedTicker, setSelectedTicker] = useState('NVDA');
  const [coreAmount, setCoreAmount] = useState(1000);
  const [satelliteAmounts, setSatelliteAmounts] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const isMultiAccount = satelliteAccounts.length > 0;

  // Initialize core amount based on real account balance
  useEffect(() => {
    if (coreAccount && coreAccount.balance) {
      const accountBalance = coreAccount.balance || coreAccount.buyingPower || 0;
      // Set initial core amount to 2% of account balance, with reasonable limits
      const suggestedAmount = Math.floor(accountBalance * 0.02);
      setCoreAmount(Math.max(100, Math.min(suggestedAmount, 2000)));
    }
  }, [coreAccount]);

  // Initialize satellite amounts when accounts are available
  useEffect(() => {
    if (satelliteAccounts.length > 0) {
      const initialAmounts = {};
      satelliteAccounts.forEach(account => {
        // Use real account balance instead of hardcoded values
        const accountBalance = account.balance || account.buyingPower || 0;
        // Set initial amount to 2% of account balance, with reasonable min/max limits
        const suggestedAmount = Math.floor(accountBalance * 0.02);
        initialAmounts[account.id] = Math.max(100, Math.min(suggestedAmount, 1000));
      });
      setSatelliteAmounts(initialAmounts);
    }
  }, [satelliteAccounts]);

  // Popular tickers for the strategy
  const popularTickers = [
    { symbol: 'NVDA', name: 'NVIDIA Corp', type: 'Tech' },
    { symbol: 'TSLA', name: 'Tesla Inc', type: 'Auto' },
    { symbol: 'AAPL', name: 'Apple Inc', type: 'Tech' },
    { symbol: 'MSFT', name: 'Microsoft Corp', type: 'Tech' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'Tech' },
    { symbol: 'META', name: 'Meta Platforms', type: 'Tech' }
  ];

  const handleTickerSelect = (ticker) => {
    setSelectedTicker(ticker.symbol);
  };

  const handleCoreAmountChange = (amount) => {
    setCoreAmount(amount);
  };

  const handleSatelliteAmountChange = (accountId, amount) => {
    setSatelliteAmounts(prev => ({
      ...prev,
      [accountId]: amount
    }));
  };

  const calculateTotalPower = () => {
    const satelliteTotal = Object.values(satelliteAmounts).reduce((sum, amount) => sum + amount, 0);
    return coreAmount + satelliteTotal;
  };

  const handleActivate = async () => {
    setIsConfiguring(true);
    
    const config = {
      ticker: selectedTicker,
      coreAmount,
      satelliteAmounts: isMultiAccount ? satelliteAmounts : {},
      totalPower: calculateTotalPower(),
      accounts: {
        core: coreAccount,
        satellites: satelliteAccounts
      },
      strategy: selectedStrategy
    };

    // Update context with configuration
    updateStrategyConfig(config);
    
    // Brief delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onActivate(config);
  };

  const renderSingleAccountView = () => (
    <motion.div
      style={styles.configContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div style={styles.header}>
        <div style={styles.strategyIcon}>
          ⚡
        </div>
        <h2 style={styles.title}>Launch "{selectedStrategy?.name}"</h2>
        <p style={styles.subtitle}>Configure your strategy for immediate deployment</p>
      </div>

      {/* Ticker Selection */}
      <div style={styles.configSection}>
        <label style={styles.sectionLabel}>📍 Ticker to trade:</label>
        <div style={styles.tickerGrid}>
          {popularTickers.slice(0, 6).map((ticker) => (
            <motion.button
              key={ticker.symbol}
              style={{
                ...styles.tickerButton,
                ...(selectedTicker === ticker.symbol ? styles.tickerButtonSelected : {})
              }}
              onClick={() => handleTickerSelect(ticker)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span style={styles.tickerSymbol}>{ticker.symbol}</span>
              <span style={styles.tickerName}>{ticker.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Account Configuration */}
      <div style={styles.configSection}>
        <label style={styles.sectionLabel}>💰 Core Account:</label>
        <div style={styles.accountCard}>
          <div style={styles.accountInfo}>
            <span style={styles.accountName}>
              {coreAccount?.broker} •••{coreAccount?.accountNumber}
            </span>
            <span style={styles.accountPower}>
              {TradingLabUtils.formatCurrency(coreAccount?.buyingPower || 0)} available
            </span>
          </div>
        </div>
      </div>

      {/* Position Size */}
      <div style={styles.configSection}>
        <label style={styles.sectionLabel}>💵 Amount per trade:</label>
        <div style={styles.amountSelector}>
          {[500, 1000, 2500, 5000].map((amount) => (
            <motion.button
              key={amount}
              style={{
                ...styles.amountButton,
                ...(coreAmount === amount ? styles.amountButtonSelected : {})
              }}
              onClick={() => handleCoreAmountChange(amount)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {TradingLabUtils.formatCurrency(amount)}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderMultiAccountView = () => (
    <motion.div
      style={styles.configContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div style={styles.header}>
        <div style={styles.networkIcon}>
          ⚛️
        </div>
        <h2 style={styles.title}>Deploy "{selectedStrategy?.name}"</h2>
        <p style={styles.subtitle}>Configure your trading network for synchronized execution</p>
      </div>

      {/* Ticker Selection */}
      <div style={styles.configSection}>
        <label style={styles.sectionLabel}>🎯 Target:</label>
        <div style={styles.tickerGrid}>
          {popularTickers.slice(0, 4).map((ticker) => (
            <motion.button
              key={ticker.symbol}
              style={{
                ...styles.tickerButton,
                ...(selectedTicker === ticker.symbol ? styles.tickerButtonSelected : {})
              }}
              onClick={() => handleTickerSelect(ticker)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span style={styles.tickerSymbol}>{ticker.symbol}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Network Configuration */}
      <div style={styles.configSection}>
        <label style={styles.sectionLabel}>💰 Your Trading Network:</label>
        
        <div style={styles.networkCard}>
          {/* Core Account */}
          <div style={styles.coreAccountSection}>
            <div style={styles.accountHeader}>
              <span style={styles.accountType}>⚛️ Core Element</span>
              <span style={styles.accountStatus}>Active</span>
            </div>
            <div style={styles.accountDetails}>
              <span style={styles.accountName}>
                {coreAccount?.broker} •••{coreAccount?.accountNumber}
              </span>
              <div style={styles.amountControls}>
                {[500, 1000, 2500].map((amount) => (
                  <button
                    key={amount}
                    style={{
                      ...styles.quickAmount,
                      ...(coreAmount === amount ? styles.quickAmountSelected : {})
                    }}
                    onClick={() => handleCoreAmountChange(amount)}
                  >
                    {TradingLabUtils.formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Satellite Accounts */}
          {satelliteAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              style={styles.satelliteAccountSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div style={styles.accountHeader}>
                <span style={styles.accountType}>🛰️ Satellite</span>
                <span style={styles.accountStatus}>Synchronized</span>
              </div>
              <div style={styles.accountDetails}>
                <span style={styles.accountName}>
                  {account.broker} •••{account.accountNumber}
                </span>
                <div style={styles.amountControls}>
                  {[250, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      style={{
                        ...styles.quickAmount,
                        ...(satelliteAmounts[account.id] === amount ? styles.quickAmountSelected : {})
                      }}
                      onClick={() => handleSatelliteAmountChange(account.id, amount)}
                    >
                      {TradingLabUtils.formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Total Network Power */}
          <div style={styles.totalPowerSection}>
            <span style={styles.totalLabel}>🎯 Total atomic power:</span>
            <span style={styles.totalAmount}>
              {TradingLabUtils.formatCurrency(calculateTotalPower())}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {isMultiAccount ? renderMultiAccountView() : renderSingleAccountView()}

        {/* Activation Button */}
        <motion.div
          style={styles.activationSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <AtomikAnimations.MicroInteractionButton
            onClick={handleActivate}
            style={{
              ...styles.activationButton,
              ...(isMultiAccount ? styles.activationButtonNetwork : styles.activationButtonSingle)
            }}
            disabled={isConfiguring}
          >
            {isConfiguring ? (
              <span>Configuring...</span>
            ) : isMultiAccount ? (
              <span>⚛️ ACTIVATE NETWORK</span>
            ) : (
              <span>⚛️ INITIATE STRATEGY</span>
            )}
            {!isConfiguring && (
              <span style={styles.activationSubtext}>
                {isMultiAccount ? '(Sync all accounts!)' : '(Start the reaction!)'}
              </span>
            )}
          </AtomikAnimations.MicroInteractionButton>
        </motion.div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  content: {
    width: '100%',
    maxWidth: '520px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  configContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  strategyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    display: 'block',
  },
  networkIcon: {
    fontSize: '3.5rem',
    marginBottom: '1rem',
    display: 'block',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#cccccc',
    margin: 0,
    fontWeight: 400,
  },
  configSection: {
    marginBottom: '1.5rem',
  },
  sectionLabel: {
    fontSize: '1rem',
    color: '#ffffff',
    fontWeight: 500,
    marginBottom: '1rem',
    display: 'block',
  },
  tickerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.75rem',
  },
  tickerButton: {
    padding: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  tickerButtonSelected: {
    backgroundColor: 'rgba(0, 198, 224, 0.2)',
    border: '1px solid rgba(0, 198, 224, 0.5)',
    color: '#00C6E0',
  },
  tickerSymbol: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  tickerName: {
    fontSize: '0.7rem',
    color: '#888888',
    textAlign: 'center',
    lineHeight: '1.2',
  },
  accountCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1rem',
    backdropFilter: 'blur(10px)',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  accountName: {
    fontSize: '1rem',
    color: '#ffffff',
    fontWeight: 500,
  },
  accountPower: {
    fontSize: '0.9rem',
    color: '#10B981',
    fontWeight: 500,
  },
  amountSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '0.75rem',
  },
  amountButton: {
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  amountButtonSelected: {
    backgroundColor: 'rgba(0, 198, 224, 0.2)',
    border: '1px solid rgba(0, 198, 224, 0.5)',
    color: '#00C6E0',
  },
  networkCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  coreAccountSection: {
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  satelliteAccountSection: {
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  accountHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  accountType: {
    fontSize: '0.9rem',
    color: '#00C6E0',
    fontWeight: 500,
  },
  accountStatus: {
    fontSize: '0.8rem',
    color: '#10B981',
    fontWeight: 500,
  },
  accountDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  amountControls: {
    display: 'flex',
    gap: '0.5rem',
  },
  quickAmount: {
    padding: '0.5rem 0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  quickAmountSelected: {
    backgroundColor: 'rgba(0, 198, 224, 0.2)',
    border: '1px solid rgba(0, 198, 224, 0.5)',
    color: '#00C6E0',
  },
  totalPowerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 198, 224, 0.1)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    borderRadius: '12px',
    padding: '1rem',
    marginTop: '0.5rem',
  },
  totalLabel: {
    fontSize: '1rem',
    color: '#00C6E0',
    fontWeight: 600,
  },
  totalAmount: {
    fontSize: '1.2rem',
    color: '#00C6E0',
    fontWeight: 700,
  },
  activationSection: {
    marginTop: '1rem',
  },
  activationButton: {
    width: '100%',
    padding: '1.25rem 1.5rem',
    borderRadius: '20px',
    fontSize: '1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    border: 'none',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  activationButtonSingle: {
    backgroundColor: 'rgba(0, 198, 224, 0.2)',
    border: '1px solid rgba(0, 198, 224, 0.5)',
    color: '#00C6E0',
  },
  activationButtonNetwork: {
    backgroundColor: 'rgba(0, 198, 224, 0.3)',
    border: '2px solid rgba(0, 198, 224, 0.7)',
    color: '#00C6E0',
    boxShadow: '0 0 20px rgba(0, 198, 224, 0.3)',
  },
  activationSubtext: {
    fontSize: '0.9rem',
    fontWeight: 400,
    opacity: 0.8,
  },
  '@media (max-width: 480px)': {
    content: {
      padding: '0 0.5rem',
    },
    title: {
      fontSize: '1.75rem',
    },
    tickerGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    amountSelector: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },
};