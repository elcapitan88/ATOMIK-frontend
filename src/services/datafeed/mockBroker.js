/**
 * Mock Broker API for TradingView Trading Terminal
 *
 * This is a DEMO-ONLY mock that returns fake data so you can
 * preview the TradingView trading UI. No real orders are placed.
 * Replace with real broker adapter for production.
 */

const MOCK_ACCOUNT = {
    id: 'mock-account-1',
    name: 'Demo Account',
    currency: 'USD',
};

// Track mock orders and positions in memory
let nextOrderId = 1;
const mockOrders = new Map();
const mockPositions = new Map();
let hostInstance = null;

class MockBrokerAPI {
    constructor(host) {
        hostInstance = host;
        this._host = host;

        // Tell TradingView we're "connected"
        setTimeout(() => {
            host.connectionStatusUpdate(1); // 1 = Connected
        }, 500);
    }

    // --- Connection ---
    connectionStatus() {
        return 1; // 1 = Connected
    }

    // --- Accounts ---
    accounts() {
        return Promise.resolve([MOCK_ACCOUNT]);
    }

    accountInfo() {
        return Promise.resolve({
            id: MOCK_ACCOUNT.id,
            name: MOCK_ACCOUNT.name,
            currency: 'USD',
            balance: 100000,
            pl: 2450.75,
            equity: 102450.75,
        });
    }

    currentAccount() {
        return MOCK_ACCOUNT.id;
    }

    setCurrentAccount(accountId) {
        // Only one mock account
    }

    accountsInfo() {
        return Promise.resolve([{
            id: MOCK_ACCOUNT.id,
            name: MOCK_ACCOUNT.name,
            currency: 'USD',
            balance: 100000,
            pl: 2450.75,
            equity: 102450.75,
        }]);
    }

    // --- Orders ---
    orders() {
        return Promise.resolve(Array.from(mockOrders.values()));
    }

    placeOrder(order) {
        const id = String(nextOrderId++);
        const now = Date.now() / 1000;

        if (order.type === 1 || order.type === undefined) {
            // Market order - fill immediately as a position
            const posId = `pos-${id}`;
            const mockPosition = {
                id: posId,
                symbol: order.symbol,
                qty: order.side === 1 ? order.qty : -order.qty,
                side: order.side, // 1 = Buy, -1 = Sell
                avgPrice: order.limitPrice || 21500.00,
                pl: 0,
            };
            mockPositions.set(posId, mockPosition);

            if (this._host) {
                this._host.positionUpdate(mockPosition);
                this._host.showNotification(
                    'Order Filled',
                    `${order.side === 1 ? 'BUY' : 'SELL'} ${order.qty} ${order.symbol} @ Market`,
                    0 // 0 = success
                );
            }

            return Promise.resolve(id);
        }

        // Limit/Stop order - keep as pending
        const mockOrder = {
            id: id,
            symbol: order.symbol,
            type: order.type, // 1=market, 2=limit, 3=stop, 4=stop-limit
            side: order.side, // 1=buy, -1=sell
            qty: order.qty,
            limitPrice: order.limitPrice,
            stopPrice: order.stopPrice,
            status: 6, // 6 = Working
            filledQty: 0,
            avgPrice: 0,
            parentId: order.parentId || undefined,
            parentType: order.parentType || undefined,
            duration: order.duration || { type: 'GTC' },
            updateTime: now,
        };

        mockOrders.set(id, mockOrder);

        if (this._host) {
            this._host.orderUpdate(mockOrder);
            this._host.showNotification(
                'Order Placed',
                `${order.side === 1 ? 'BUY' : 'SELL'} ${order.qty} ${order.symbol} @ ${order.limitPrice || order.stopPrice || 'Market'}`,
                0
            );
        }

        return Promise.resolve(id);
    }

    modifyOrder(id, modifications) {
        const order = mockOrders.get(id);
        if (!order) return Promise.reject('Order not found');

        Object.assign(order, modifications, { updateTime: Date.now() / 1000 });
        mockOrders.set(id, order);

        if (this._host) {
            this._host.orderUpdate(order);
        }

        return Promise.resolve();
    }

    cancelOrder(id) {
        const order = mockOrders.get(id);
        if (!order) return Promise.reject('Order not found');

        order.status = 1; // 1 = Canceled
        mockOrders.set(id, order);

        if (this._host) {
            this._host.orderUpdate(order);
            this._host.showNotification('Order Canceled', `Order #${id} canceled`, 0);
        }

        // Clean up after a moment
        setTimeout(() => mockOrders.delete(id), 2000);

        return Promise.resolve();
    }

    // --- Positions ---
    positions() {
        return Promise.resolve(Array.from(mockPositions.values()));
    }

    closePosition(positionId) {
        const pos = mockPositions.get(positionId);
        if (!pos) return Promise.reject('Position not found');

        mockPositions.delete(positionId);

        if (this._host) {
            this._host.positionUpdate({ ...pos, qty: 0 });
            this._host.showNotification('Position Closed', `Closed ${pos.symbol} position`, 0);
        }

        return Promise.resolve();
    }

    reversePosition(positionId) {
        const pos = mockPositions.get(positionId);
        if (!pos) return Promise.reject('Position not found');

        pos.qty = -pos.qty;
        pos.side = pos.side === 1 ? -1 : 1;
        mockPositions.set(positionId, pos);

        if (this._host) {
            this._host.positionUpdate(pos);
        }

        return Promise.resolve();
    }

    // --- Instrument Info ---
    symbolInfo(symbol) {
        return Promise.resolve({
            qty: { min: 1, max: 100, step: 1, default: 1 },
            pipSize: 0.25,
            pipValue: 20,
            minTick: 0.25,
            description: symbol,
        });
    }

    // --- Order Ticket Defaults ---
    durations() {
        return Promise.resolve([
            { name: 'GTC', value: 'GTC' },
            { name: 'DAY', value: 'DAY' },
        ]);
    }

    orderTypes() {
        return [
            { id: 1, name: 'Market' },
            { id: 2, name: 'Limit' },
            { id: 3, name: 'Stop' },
            { id: 4, name: 'Stop Limit' },
        ];
    }

    // --- Execution Reports ---
    executions(symbol) {
        return Promise.resolve([]);
    }

    // --- DOM (Depth of Market) - optional ---
    subscribeDOM(symbol, callback) {
        return;
    }

    unsubscribeDOM(symbol) {
        return;
    }

    // --- Real-time updates ---
    subscribeRealtime(symbol) {
        return;
    }

    unsubscribeRealtime(symbol) {
        return;
    }
}

// Factory function that TradingView calls
export function createMockBrokerFactory() {
    return {
        createDelegate: () => {
            return Promise.resolve({
                buttonDropdownActions: undefined,
                chartContextMenuActions: undefined,
                isTradable: (symbol) => Promise.resolve(true),
                plOrdersContextMenuActions: undefined,
                possibleOrderTypes: undefined,
            });
        },
        createLoginButtonActions: undefined,
        createBroker: (host) => {
            return new MockBrokerAPI(host);
        },
    };
}
