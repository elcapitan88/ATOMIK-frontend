// Custom Datafeed Implementation for TradingView Advanced Charts
// This provides a basic implementation that can be extended with your own data source

class CustomDatafeed {
    constructor(datafeedUrl = '/api/v1/tradingview') {
        this.datafeedUrl = datafeedUrl;
        this.configuration = {
            exchanges: [
                { value: 'NASDAQ', name: 'NASDAQ', desc: 'NASDAQ Stock Exchange' },
                { value: 'NYSE', name: 'NYSE', desc: 'New York Stock Exchange' },
                { value: 'AMEX', name: 'AMEX', desc: 'American Stock Exchange' }
            ],
            symbols_types: [
                { name: 'Stock', value: 'stock' },
                { name: 'Index', value: 'index' }
            ],
            supported_resolutions: ['1', '5', '15', '30', '60', '120', '240', 'D', 'W', 'M'],
            supports_marks: false,
            supports_timescale_marks: false,
            supports_time: true
        };
    }

    // Main configuration method
    onReady(callback) {
        console.log('[CustomDatafeed]: onReady called');
        setTimeout(() => callback(this.configuration), 0);
    }

    // Search symbols
    searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
        console.log('[CustomDatafeed]: searchSymbols called', { userInput, exchange, symbolType });

        // For demo purposes, return some hardcoded symbols
        // Replace this with actual API call to your backend
        const symbols = [
            {
                symbol: 'SPY',
                full_name: 'AMEX:SPY',
                description: 'SPDR S&P 500 ETF',
                exchange: 'AMEX',
                ticker: 'SPY',
                type: 'stock'
            },
            {
                symbol: 'QQQ',
                full_name: 'NASDAQ:QQQ',
                description: 'Invesco QQQ Trust',
                exchange: 'NASDAQ',
                ticker: 'QQQ',
                type: 'stock'
            },
            {
                symbol: 'AAPL',
                full_name: 'NASDAQ:AAPL',
                description: 'Apple Inc.',
                exchange: 'NASDAQ',
                ticker: 'AAPL',
                type: 'stock'
            }
        ];

        const results = symbols.filter(sym =>
            sym.symbol.toLowerCase().includes(userInput.toLowerCase()) ||
            sym.description.toLowerCase().includes(userInput.toLowerCase())
        );

        onResultReadyCallback(results);
    }

    // Resolve symbol
    resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback, extension) {
        console.log('[CustomDatafeed]: resolveSymbol called', { symbolName });

        const symbol_stub = {
            name: symbolName,
            description: symbolName,
            type: 'stock',
            session: '24x7',
            timezone: 'America/New_York',
            ticker: symbolName,
            exchange: symbolName.split(':')[0] || 'NASDAQ',
            minmov: 1,
            pricescale: 100,
            has_intraday: true,
            has_daily: true,
            has_weekly_and_monthly: true,
            supported_resolutions: this.configuration.supported_resolutions,
            volume_precision: 2,
            data_status: 'streaming',
            full_name: symbolName
        };

        setTimeout(() => onSymbolResolvedCallback(symbol_stub), 0);
    }

    // Get bars (historical data)
    getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
        const { from, to, firstDataRequest } = periodParams;
        console.log('[CustomDatafeed]: getBars called', {
            symbol: symbolInfo.name,
            resolution,
            from: new Date(from * 1000),
            to: new Date(to * 1000),
            firstDataRequest
        });

        // Generate demo candlestick data
        // Replace this with actual API call to your backend
        const bars = [];
        const resolutionMinutes = this.getResolutionInMinutes(resolution);
        const barTime = from * 1000; // Convert to milliseconds
        const endTime = to * 1000;

        let currentTime = barTime;
        let lastClose = 100;

        while (currentTime < endTime) {
            const open = lastClose;
            const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
            const high = open + Math.random() * 2;
            const low = open - Math.random() * 2;
            const close = open + change;
            const volume = Math.floor(Math.random() * 1000000) + 100000;

            bars.push({
                time: currentTime,
                open: open,
                high: Math.max(high, open, close),
                low: Math.min(low, open, close),
                close: close,
                volume: volume
            });

            lastClose = close;
            currentTime += resolutionMinutes * 60 * 1000;
        }

        if (bars.length === 0) {
            onHistoryCallback([], { noData: true });
        } else {
            onHistoryCallback(bars, { noData: false });
        }
    }

    // Subscribe to real-time updates
    subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
        console.log('[CustomDatafeed]: subscribeBars called', {
            symbol: symbolInfo.name,
            resolution,
            subscriberUID
        });

        // For demo purposes, generate random updates every 5 seconds
        // Replace this with actual WebSocket or SSE connection to your backend
        const intervalId = setInterval(() => {
            const lastBar = {
                time: Date.now(),
                open: 100 + Math.random() * 10,
                high: 105 + Math.random() * 10,
                low: 95 + Math.random() * 10,
                close: 100 + Math.random() * 10,
                volume: Math.floor(Math.random() * 1000000) + 100000
            };
            onRealtimeCallback(lastBar);
        }, 5000);

        // Store the interval ID for cleanup
        window.tvDatafeedIntervals = window.tvDatafeedIntervals || {};
        window.tvDatafeedIntervals[subscriberUID] = intervalId;
    }

    // Unsubscribe from real-time updates
    unsubscribeBars(subscriberUID) {
        console.log('[CustomDatafeed]: unsubscribeBars called', { subscriberUID });

        if (window.tvDatafeedIntervals && window.tvDatafeedIntervals[subscriberUID]) {
            clearInterval(window.tvDatafeedIntervals[subscriberUID]);
            delete window.tvDatafeedIntervals[subscriberUID];
        }
    }

    // Helper method to convert resolution to minutes
    getResolutionInMinutes(resolution) {
        const resolutionMap = {
            '1': 1,
            '5': 5,
            '15': 15,
            '30': 30,
            '60': 60,
            '120': 120,
            '240': 240,
            'D': 1440,
            'W': 10080,
            'M': 43200
        };
        return resolutionMap[resolution] || 60;
    }

    // Calculate history depth (optional but recommended)
    calculateHistoryDepth(resolution, resolutionBack, intervalBack) {
        // This helps TradingView understand how much data to request
        return undefined; // Let TradingView decide
    }

    // Get marks (optional)
    getMarks(symbolInfo, from, to, onDataCallback, resolution) {
        // Can be used to show special marks on the chart
        onDataCallback([]);
    }

    // Get time scale marks (optional)
    getTimescaleMarks(symbolInfo, from, to, onDataCallback, resolution) {
        // Can be used to show special time marks
        onDataCallback([]);
    }

    // Get server time (optional but recommended for real-time data)
    getServerTime(callback) {
        callback(Math.floor(Date.now() / 1000));
    }
}

export default CustomDatafeed;