/**
 * Status and type mappings between our WebSocket data and TradingView's Broker API.
 * TradingView uses numeric constants; our WebSocket uses strings.
 */

// TradingView ConnectionStatus enum
export const ConnectionStatus = {
    Connected: 1,
    Connecting: 2,
    Disconnected: 3,
    Error: 4,
};

// TradingView OrderStatus enum
export const OrderStatus = {
    Canceled: 1,
    Filled: 2,
    Inactive: 3,
    Placing: 4,
    Rejected: 5,
    Working: 6,
};

// TradingView OrderType enum
export const OrderType = {
    Market: 1,
    Limit: 2,
    Stop: 3,
    StopLimit: 4,
};

// Map WebSocket order status strings -> TradingView OrderStatus numbers
export function mapOrderStatus(wsStatus) {
    const mapping = {
        'Working': OrderStatus.Working,
        'Filled': OrderStatus.Filled,
        'Cancelled': OrderStatus.Canceled,
        'Canceled': OrderStatus.Canceled,
        'Rejected': OrderStatus.Rejected,
        'Expired': OrderStatus.Canceled,
        'Pending': OrderStatus.Placing,
        'PendingNew': OrderStatus.Placing,
        'Suspended': OrderStatus.Inactive,
    };
    return mapping[wsStatus] || OrderStatus.Working;
}

// Map WebSocket order type strings -> TradingView OrderType numbers
export function mapOrderType(wsType) {
    const mapping = {
        'Market': OrderType.Market,
        'Limit': OrderType.Limit,
        'Stop': OrderType.Stop,
        'StopLimit': OrderType.StopLimit,
    };
    return mapping[wsType] || OrderType.Market;
}

// Map TradingView OrderType numbers -> backend order type strings
export function tvOrderTypeToBackend(tvType) {
    const mapping = {
        [OrderType.Market]: 'MARKET',
        [OrderType.Limit]: 'LIMIT',
        [OrderType.Stop]: 'STOP',
        [OrderType.StopLimit]: 'STOP_LIMIT',
    };
    return mapping[tvType] || 'MARKET';
}

// Map WebSocket side strings -> TradingView side numbers (1=Buy, -1=Sell)
export function mapSide(side) {
    if (side === 'Buy' || side === 'Long' || side === 1) return 1;
    if (side === 'Sell' || side === 'Short' || side === -1) return -1;
    return 1;
}

// Map TradingView side numbers -> backend side strings
export function tvSideToBackend(tvSide) {
    return tvSide === 1 ? 'BUY' : 'SELL';
}
