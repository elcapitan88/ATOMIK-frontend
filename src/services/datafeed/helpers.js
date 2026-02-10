// DataHub connection config
export const DATAHUB_URL = process.env.REACT_APP_DATAHUB_URL || 'https://atomikdatahub-production.up.railway.app';
export const DATAHUB_API_KEY = process.env.REACT_APP_DATAHUB_API_KEY || '';

// CME Futures symbol config for TradingView resolveSymbol()
// tick_size = minmov / pricescale
// Session '1700-1600:12345' = 5 PM CT to 4 PM CT next day, Sun-Thu start days.
// Day codes: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
// CME futures open Sunday 5 PM CT, close Friday 4 PM CT, daily halt 4-5 PM CT.
// The ':12345' tells TradingView to collapse weekend/off-day gaps on the time axis.
export const SYMBOL_CONFIG = {
  NQ:  { name: 'NQ',  description: 'E-mini Nasdaq-100',       exchange: 'CME',   type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 25,  pricescale: 100,  pointvalue: 20 },
  MNQ: { name: 'MNQ', description: 'Micro E-mini Nasdaq-100', exchange: 'CME',   type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 25,  pricescale: 100,  pointvalue: 2 },
  ES:  { name: 'ES',  description: 'E-mini S&P 500',          exchange: 'CME',   type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 25,  pricescale: 100,  pointvalue: 50 },
  MES: { name: 'MES', description: 'Micro E-mini S&P 500',    exchange: 'CME',   type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 25,  pricescale: 100,  pointvalue: 5 },
  YM:  { name: 'YM',  description: 'E-mini Dow Jones',        exchange: 'CBOT',  type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 1,   pricescale: 1,    pointvalue: 5 },
  RTY: { name: 'RTY', description: 'E-mini Russell 2000',     exchange: 'CME',   type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 10,  pricescale: 100,  pointvalue: 50 },
  CL:  { name: 'CL',  description: 'Crude Oil',               exchange: 'NYMEX', type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 1,   pricescale: 100,  pointvalue: 1000 },
  GC:  { name: 'GC',  description: 'Gold',                    exchange: 'COMEX', type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 10,  pricescale: 100,  pointvalue: 100 },
  SI:  { name: 'SI',  description: 'Silver',                  exchange: 'COMEX', type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 5,   pricescale: 1000, pointvalue: 5000 },
  NG:  { name: 'NG',  description: 'Natural Gas',             exchange: 'NYMEX', type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 1,   pricescale: 1000, pointvalue: 10000 },
  MBT: { name: 'MBT', description: 'Micro Bitcoin',           exchange: 'CME',   type: 'futures', session: '1700-1600:12345', timezone: 'America/Chicago', minmov: 500, pricescale: 100,  pointvalue: 0.1 },
};

// TradingView resolution string -> DataHub interval
export const RESOLUTION_MAP = {
  '1':   '1m',
  '5':   '5m',
  '15':  '15m',
  '30':  '30m',
  '60':  '1h',
  '240': '4h',
  '1D':  '1d',
  '1W':  '1w',
};

export const SUPPORTED_RESOLUTIONS = ['1', '5', '15', '30', '60', '240', '1D', '1W'];

const RESOLUTION_MS = {
  '1':   60000,
  '5':   300000,
  '15':  900000,
  '30':  1800000,
  '60':  3600000,
  '240': 14400000,
  '1D':  86400000,
  '1W':  604800000,
};

// Convert TradingView resolution string to milliseconds
export function resolutionToMs(resolution) {
  return RESOLUTION_MS[resolution] || 60000;
}

// Calculate the opening time of the next bar after a given bar time
export function getNextBarTime(barTime, resolution) {
  return barTime + resolutionToMs(resolution);
}
