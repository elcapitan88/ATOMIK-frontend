import axios from 'axios';

// Cache for contract mappings
let contractCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Fallback contract calculation (mirrors backend logic)
const calculateCurrentContracts = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-based
  
  // Contract months
  const contractMonths = {
    3: 'H',   // March
    6: 'M',   // June
    9: 'U',   // September
    12: 'Z'   // December
  };
  
  // Find third Monday of a month
  const getThirdMonday = (year, month) => {
    const firstDay = new Date(year, month - 1, 1);
    const dayOfWeek = firstDay.getDay();
    const daysUntilMonday = (8 - dayOfWeek) % 7;
    const firstMonday = new Date(year, month - 1, 1 + daysUntilMonday);
    const thirdMonday = new Date(firstMonday);
    thirdMonday.setDate(firstMonday.getDate() + 14);
    return thirdMonday;
  };
  
  // Determine current contract month
  let contractMonth, contractYear;
  const quarterlyMonths = [3, 6, 9, 12];
  
  for (const qMonth of quarterlyMonths) {
    if (month <= qMonth) {
      const rolloverDate = getThirdMonday(year, qMonth);
      if (now < rolloverDate) {
        contractMonth = qMonth;
        contractYear = year;
        break;
      }
    }
  }
  
  // If we didn't find a month, we're past December rollover
  if (!contractMonth) {
    contractMonth = 3;
    contractYear = year + 1;
  }
  
  const monthCode = contractMonths[contractMonth];
  const yearSuffix = contractYear.toString().slice(-1);
  
  // Generate contracts for quarterly symbols
  const quarterlySymbols = ['ES', 'NQ', 'CL', 'GC', 'MES', 'MNQ', 'RTY', 'YM'];
  const contracts = {};
  
  quarterlySymbols.forEach(symbol => {
    contracts[symbol] = `${symbol}${monthCode}${yearSuffix}`;
  });
  
  // Handle monthly contracts (MBT)
  const monthlySymbols = ['MBT'];
  const monthlyMonthCodes = {
    1: 'F', 2: 'G', 3: 'H', 4: 'J', 5: 'K', 6: 'M',
    7: 'N', 8: 'Q', 9: 'U', 10: 'V', 11: 'X', 12: 'Z'
  };
  
  // Calculate Monday before third Friday for monthly contracts
  const getMondayBeforeThirdFriday = (year, month) => {
    const firstDay = new Date(year, month - 1, 1);
    const dayOfWeek = firstDay.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const firstFriday = new Date(year, month - 1, 1 + daysUntilFriday);
    const thirdFriday = new Date(firstFriday);
    thirdFriday.setDate(firstFriday.getDate() + 14);
    
    // Go back to preceding Monday
    const mondayBefore = new Date(thirdFriday);
    mondayBefore.setDate(thirdFriday.getDate() - 4);
    return mondayBefore;
  };
  
  const currentMonthRollover = getMondayBeforeThirdFriday(year, month);
  let monthlyContractMonth, monthlyContractYear;
  
  if (now < currentMonthRollover) {
    monthlyContractMonth = month;
    monthlyContractYear = year;
  } else {
    if (month === 12) {
      monthlyContractMonth = 1;
      monthlyContractYear = year + 1;
    } else {
      monthlyContractMonth = month + 1;
      monthlyContractYear = year;
    }
  }
  
  const monthlyMonthCode = monthlyMonthCodes[monthlyContractMonth];
  const monthlyYearSuffix = monthlyContractYear.toString().slice(-1);
  
  monthlySymbols.forEach(symbol => {
    contracts[symbol] = `${symbol}${monthlyMonthCode}${monthlyYearSuffix}`;
  });
  
  return contracts;
};

// Fetch contracts from API with caching
const fetchContractsFromAPI = async () => {
  try {
    // Check cache first
    if (contractCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return contractCache;
    }
    
    const response = await axios.get('/api/v1/futures-contracts/current');
    contractCache = response.data;
    cacheTimestamp = Date.now();
    
    // Store in localStorage as backup
    localStorage.setItem('futuresContracts', JSON.stringify(contractCache));
    localStorage.setItem('futuresContractsTimestamp', cacheTimestamp.toString());
    
    return contractCache;
  } catch (error) {
    console.warn('Failed to fetch contracts from API, using fallback:', error);
    
    // Try localStorage first
    const storedContracts = localStorage.getItem('futuresContracts');
    const storedTimestamp = localStorage.getItem('futuresContractsTimestamp');
    
    if (storedContracts && storedTimestamp) {
      const timestamp = parseInt(storedTimestamp);
      // Use stored contracts if less than 24 hours old
      if (Date.now() - timestamp < 86400000) {
        return JSON.parse(storedContracts);
      }
    }
    
    // Fall back to calculation
    return calculateCurrentContracts();
  }
};

// Parse tickers - now async but with sync fallback
export const getTickers = async () => {
  // First, check if we should use environment variables (for backward compatibility)
  const envTickers = process.env.REACT_APP_FUTURES_TICKERS;
  if (envTickers && envTickers.includes(':')) {
    // Legacy format detected, parse it
    const tickerPairs = envTickers.split(',');
    return tickerPairs.reduce((acc, pair) => {
      const [display, contract] = pair.split(':');
      acc[display] = contract;
      return acc;
    }, {});
  }
  
  // Use API or calculated contracts
  return await fetchContractsFromAPI();
};

// Synchronous version for immediate use
export const getTickersSync = () => {
  // Use cache if available
  if (contractCache) {
    return contractCache;
  }
  
  // Check localStorage
  const storedContracts = localStorage.getItem('futuresContracts');
  if (storedContracts) {
    contractCache = JSON.parse(storedContracts);
    return contractCache;
  }
  
  // Check env variables
  const envTickers = process.env.REACT_APP_FUTURES_TICKERS;
  if (envTickers && envTickers.includes(':')) {
    const tickerPairs = envTickers.split(',');
    const contracts = tickerPairs.reduce((acc, pair) => {
      const [display, contract] = pair.split(':');
      acc[display] = contract;
      return acc;
    }, {});
    contractCache = contracts;
    return contracts;
  }
  
  // Calculate as last resort
  contractCache = calculateCurrentContracts();
  return contractCache;
};

// Get display tickers for dropdowns
export const getDisplayTickers = () => Object.keys(getTickersSync());

// Get full contract spec for a display ticker
export const getContractTicker = (displayTicker) => {
  const tickers = getTickersSync();
  return tickers[displayTicker] || displayTicker;
};

// Convert full contract to display ticker
export const getDisplayTicker = (contractTicker) => {
  const tickers = getTickersSync();
  for (const [display, contract] of Object.entries(tickers)) {
    if (contract === contractTicker) return display;
  }
  return contractTicker;
};

// Initialize contracts on load
export const initializeContracts = async () => {
  await getTickers();
};

// Get contract info including rollover dates
export const getContractInfo = async () => {
  try {
    const response = await axios.get('/api/v1/futures-contracts/info');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch contract info:', error);
    return null;
  }
};

// Force refresh contracts
export const refreshContracts = async () => {
  contractCache = null;
  cacheTimestamp = null;
  localStorage.removeItem('futuresContracts');
  localStorage.removeItem('futuresContractsTimestamp');
  return await getTickers();
};