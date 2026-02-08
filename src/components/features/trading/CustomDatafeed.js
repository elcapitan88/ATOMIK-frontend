import {
  SYMBOL_CONFIG,
  SUPPORTED_RESOLUTIONS,
  RESOLUTION_MAP,
  DATAHUB_URL,
  DATAHUB_API_KEY,
} from '@services/datafeed/helpers';
import { subscribeOnStream, unsubscribeFromStream } from '@services/datafeed/streaming';

// Shared cache of the last bar per symbol, used to seed streaming subscriptions
const lastBarsCache = new Map();

const configurationData = {
  supported_resolutions: SUPPORTED_RESOLUTIONS,
  exchanges: [
    { value: 'CME',   name: 'CME',   desc: 'Chicago Mercantile Exchange' },
    { value: 'CBOT',  name: 'CBOT',  desc: 'Chicago Board of Trade' },
    { value: 'NYMEX', name: 'NYMEX', desc: 'New York Mercantile Exchange' },
    { value: 'COMEX', name: 'COMEX', desc: 'Commodity Exchange' },
  ],
  symbols_types: [
    { name: 'Futures', value: 'futures' },
  ],
  supports_marks: false,
  supports_timescale_marks: false,
  supports_time: true,
};

class CustomDatafeed {
  onReady(callback) {
    setTimeout(() => callback(configurationData), 0);
  }

  searchSymbols(userInput, exchange, symbolType, onResult) {
    const query = (userInput || '').toUpperCase();
    const results = Object.values(SYMBOL_CONFIG)
      .filter((cfg) => {
        if (exchange && cfg.exchange !== exchange) return false;
        return (
          cfg.name.toUpperCase().includes(query) ||
          cfg.description.toUpperCase().includes(query)
        );
      })
      .map((cfg) => ({
        symbol: cfg.name,
        full_name: `${cfg.exchange}:${cfg.name}`,
        description: cfg.description,
        exchange: cfg.exchange,
        ticker: cfg.name,
        type: cfg.type,
      }));

    onResult(results);
  }

  resolveSymbol(symbolName, onResolve, onError) {
    // Strip exchange prefix if present (e.g. "CME:NQ" -> "NQ")
    const ticker = symbolName.includes(':') ? symbolName.split(':').pop() : symbolName;
    const cfg = SYMBOL_CONFIG[ticker.toUpperCase()];

    if (!cfg) {
      onError(`[CustomDatafeed] Unknown symbol: ${symbolName}`);
      return;
    }

    const symbolInfo = {
      ticker: cfg.name,
      name: `${cfg.exchange}:${cfg.name}`,
      description: cfg.description,
      type: cfg.type,
      session: cfg.session,
      exchange: cfg.exchange,
      listed_exchange: cfg.exchange,
      timezone: cfg.timezone,
      minmov: cfg.minmov,
      pricescale: cfg.pricescale,
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      supported_resolutions: SUPPORTED_RESOLUTIONS,
      volume_precision: 0,
      data_status: 'streaming',
      visible_plots_set: 'ohlcv',
      format: 'price',
    };

    setTimeout(() => onResolve(symbolInfo), 0);
  }

  getBars(symbolInfo, resolution, periodParams, onResult, onError) {
    const interval = RESOLUTION_MAP[resolution];
    if (!interval) {
      onError(`[CustomDatafeed] Unsupported resolution: ${resolution}`);
      return;
    }

    const ticker = symbolInfo.ticker;
    const countBack = periodParams.countBack || 300;

    let url = `${DATAHUB_URL}/api/v1/historical/${ticker}?bars=${countBack}&interval=${interval}`;

    if (DATAHUB_API_KEY) {
      url += `&api_key=${DATAHUB_API_KEY}`;
    }

    // For scrollback requests (not the initial load), send time range
    if (!periodParams.firstDataRequest && periodParams.from && periodParams.to) {
      url += `&start=${new Date(periodParams.from * 1000).toISOString()}`;
      url += `&end=${new Date(periodParams.to * 1000).toISOString()}`;
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const rawBars = Array.isArray(data) ? data : data.bars || data.data || [];

        const bars = rawBars
          .map((bar) => ({
            time: new Date(bar.time || bar.timestamp || bar.t).getTime(),
            open: Number(bar.open ?? bar.o),
            high: Number(bar.high ?? bar.h),
            low: Number(bar.low ?? bar.l),
            close: Number(bar.close ?? bar.c),
            volume: Number(bar.volume ?? bar.v ?? 0),
          }))
          .filter((bar) => !isNaN(bar.time) && !isNaN(bar.close))
          .sort((a, b) => a.time - b.time);

        if (bars.length > 0) {
          lastBarsCache.set(ticker, { ...bars[bars.length - 1] });
        }

        onResult(bars, { noData: bars.length === 0 });
      })
      .catch((err) => {
        console.error(`[CustomDatafeed] getBars error for ${ticker}:`, err);
        onError('Failed to fetch historical data');
      });
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID) {
    const ticker = symbolInfo.ticker;
    const lastBar = lastBarsCache.get(ticker) || null;
    subscribeOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, lastBar);
  }

  unsubscribeBars(subscriberUID) {
    unsubscribeFromStream(subscriberUID);
  }
}

export default CustomDatafeed;
