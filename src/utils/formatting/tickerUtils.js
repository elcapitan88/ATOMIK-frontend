// Parse tickers from environment variables
export const getTickers = () => {
    const tickerString = process.env.REACT_APP_FUTURES_TICKERS || '';
    const tickerPairs = tickerString.split(',');
    
    return tickerPairs.reduce((acc, pair) => {
      const [display, contract] = pair.split(':');
      acc[display] = contract;
      return acc;
    }, {});
  };
  
  // Get display tickers for dropdowns
  export const getDisplayTickers = () => Object.keys(getTickers());
  
  // Get full contract spec for a display ticker
  export const getContractTicker = (displayTicker) => getTickers()[displayTicker] || displayTicker;
  
  // Convert full contract to display ticker
  export const getDisplayTicker = (contractTicker) => {
    const tickers = getTickers();
    for (const [display, contract] of Object.entries(tickers)) {
      if (contract === contractTicker) return display;
    }
    return contractTicker;
  };