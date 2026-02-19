/**
 * AtomikBrokerAdapter
 *
 * Implements TradingView's IBrokerTerminal interface (extends IBrokerCommon + IBrokerAccountInfo).
 * Bridges between TradingView's trading terminal and our backend REST API + WebSocket data.
 *
 * Orders -> Backend REST API (validation, execution, trade recording)
 * Real-time updates -> WebSocketManager (positions, orders, account data)
 *
 * Required interface methods:
 *   IBrokerAccountInfo: accountsMetainfo(), currentAccount(), setCurrentAccount()
 *   IBrokerCommon: connectionStatus(), orders(), positions(), executions(), symbolInfo(),
 *                  accountManagerInfo(), isTradable(), chartContextMenuActions()
 *   IBrokerTerminal: placeOrder(), modifyOrder(order), cancelOrder(), closePosition(), reversePosition()
 */
import axios from 'axios';
import webSocketManager from '@/services/websocket-proxy/WebSocketManager';
import { getDisplayTicker, getContractTicker } from '@utils/formatting/tickerUtils';
import { SYMBOL_CONFIG } from './helpers';
import {
    ConnectionStatus,
    OrderStatus,
    mapOrderStatus,
    mapOrderType,
    mapSide,
    tvOrderTypeToBackend,
    tvSideToBackend,
} from './statusMapping';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.atomiktrading.io';

export class AtomikBrokerAdapter {
    constructor(host, config) {
        console.log('[BrokerAdapter] Constructor called — accountId:', config.accountId, 'brokerId:', config.brokerId);
        this._host = host;
        this._accountId = config.accountId;
        this._brokerId = config.brokerId || 'tradovate';
        this._getToken = config.getAccessToken;
        this._onOrderPlaced = config.onOrderPlaced;
        this._onError = config.onError;
        this._accountName = '';
        this._listeners = [];

        // WatchedValues for Account Manager summary fields
        this._balanceWV = host.factory.createWatchedValue(0);
        this._plWV = host.factory.createWatchedValue(0);
        this._equityWV = host.factory.createWatchedValue(0);

        // Set up WebSocket listeners for real-time updates
        this._setupWebSocketListeners();

        // Load initial account name and update summary values
        this._loadAccountName();
        this._updateAccountSummary();

        // Tell TradingView we're connected (after a brief delay to let WS sync)
        setTimeout(() => {
            console.log('[BrokerAdapter] Sending ConnectionStatus.Connected to TradingView');
            host.connectionStatusUpdate(ConnectionStatus.Connected);
        }, 500);
    }

    // --- Connection ---------------------------------------------------------
    connectionStatus() {
        return ConnectionStatus.Connected;
    }

    // --- IBrokerAccountInfo (required) --------------------------------------
    accountsMetainfo() {
        console.log('[BrokerAdapter] accountsMetainfo() called');
        return Promise.resolve([{
            id: String(this._accountId),
            name: this._accountName || 'Trading Account',
            currency: 'USD',
        }]);
    }

    currentAccount() {
        return String(this._accountId);
    }

    setCurrentAccount(accountId) {
        this._accountId = accountId;
        this._loadAccountName();
        this._updateAccountSummary();
    }

    // --- IBrokerCommon: accountManagerInfo() (required, synchronous) ---------
    accountManagerInfo() {
        console.log('[BrokerAdapter] accountManagerInfo() called');
        return {
            accountTitle: 'Atomik Trading',
            summary: [
                { text: 'Balance', wValue: this._balanceWV, formatter: 'fixed' },
                { text: 'P&L', wValue: this._plWV, formatter: 'fixed' },
                { text: 'Equity', wValue: this._equityWV, formatter: 'fixed' },
            ],
            orderColumns: [
                { label: 'Symbol', id: 'symbol', dataFields: ['symbol'] },
                { label: 'Side', id: 'side', dataFields: ['side'] },
                { label: 'Type', id: 'type', dataFields: ['type'] },
                { label: 'Qty', id: 'qty', dataFields: ['qty'] },
                { label: 'Limit', id: 'limitPrice', dataFields: ['limitPrice'] },
                { label: 'Stop', id: 'stopPrice', dataFields: ['stopPrice'] },
                { label: 'Status', id: 'status', dataFields: ['status'] },
            ],
            positionColumns: [
                { label: 'Symbol', id: 'symbol', dataFields: ['symbol'] },
                { label: 'Side', id: 'side', dataFields: ['side'] },
                { label: 'Qty', id: 'qty', dataFields: ['qty'] },
                { label: 'Avg Price', id: 'avgPrice', dataFields: ['avgPrice'] },
                { label: 'P&L', id: 'pl', dataFields: ['pl'] },
            ],
            pages: [],
        };
    }

    // --- IBrokerCommon: isTradable() (required) -----------------------------
    isTradable(symbol) {
        console.log('[BrokerAdapter] isTradable() called for:', symbol);
        return Promise.resolve(true);
    }

    // --- IBrokerCommon: chartContextMenuActions() (required) -----------------
    chartContextMenuActions(context, options) {
        return Promise.resolve([]);
    }

    // --- Orders -------------------------------------------------------------
    async orders() {
        const wsOrders = webSocketManager.getOrders(this._brokerId, String(this._accountId));
        console.log('[BrokerAdapter] orders() called — raw WS orders:', wsOrders.length, wsOrders.map(o => ({ id: o.orderId || o.id, symbol: o.symbol, status: o.orderStatus || o.status })));
        const filtered = wsOrders
            .filter(o => {
                const status = mapOrderStatus(o.orderStatus || o.status);
                return status === OrderStatus.Working || status === OrderStatus.Placing;
            })
            .map(o => this._transformOrder(o));
        console.log('[BrokerAdapter] orders() returning:', filtered.length, 'working orders', filtered);
        return filtered;
    }

    async placeOrder(preOrder) {
        console.log('[BrokerAdapter] placeOrder() called:', preOrder);
        const contractTicker = getContractTicker(preOrder.symbol);

        const payload = {
            symbol: contractTicker,
            side: tvSideToBackend(preOrder.side),
            quantity: preOrder.qty,
            type: tvOrderTypeToBackend(preOrder.type),
        };

        // Add price fields for limit/stop orders
        if (preOrder.limitPrice != null) {
            payload.price = preOrder.limitPrice;
        }
        if (preOrder.stopPrice != null) {
            payload.stop_price = preOrder.stopPrice;
        }

        try {
            const resp = await this._api('POST',
                `/api/v1/brokers/accounts/${this._accountId}/discretionary/orders`,
                payload
            );

            const orderId = String(resp.data?.order?.order_id || resp.data?.order?.orderId || 'unknown');

            this._host.showNotification(
                'Order Placed',
                `${payload.side} ${payload.quantity} ${preOrder.symbol} @ ${tvOrderTypeToBackend(preOrder.type)}`,
                0 // 0 = success
            );

            if (this._onOrderPlaced) {
                this._onOrderPlaced(orderId, payload);
            }

            return { orderId };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message;
            this._host.showNotification(
                'Order Failed',
                errorMsg,
                1 // 1 = error
            );
            if (this._onError) {
                this._onError(err);
            }
            throw err;
        }
    }

    async modifyOrder(order) {
        // TradingView passes the full Order object with updated fields
        console.log('[BrokerAdapter] modifyOrder() called:', order);
        const orderId = order.id;
        const payload = {};
        // Tradovate requires orderQty and orderType on every modifyOrder call
        if (order.qty != null) payload.qty = order.qty;
        if (order.limitPrice != null) payload.limitPrice = order.limitPrice;
        if (order.stopPrice != null) payload.stopPrice = order.stopPrice;
        // Use the canonical tvOrderTypeToBackend mapping (Market=1, Limit=2, Stop=3, StopLimit=4)
        payload.orderType = order.type != null
            ? tvOrderTypeToBackend(order.type)
            : 'LIMIT';
        // Chart-originated modifications are not automated
        payload.isAutomated = false;

        try {
            await this._api('PUT',
                `/api/v1/brokers/accounts/${this._accountId}/orders/${orderId}`,
                payload
            );
            // TradingView will pick up the update via WebSocket orderUpdate event
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message;
            this._host.showNotification(
                'Modify Failed',
                errorMsg,
                1
            );
            throw err;
        }
    }

    async cancelOrder(orderId) {
        console.log('[BrokerAdapter] cancelOrder() called:', orderId);
        try {
            await this._api('DELETE',
                `/api/v1/brokers/accounts/${this._accountId}/orders/${orderId}`
            );
            this._host.showNotification('Order Canceled', `Order #${orderId} canceled`, 0);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message;
            this._host.showNotification(
                'Cancel Failed',
                errorMsg,
                1
            );
            throw err;
        }
    }

    async cancelOrders(symbol, side, ordersIds) {
        console.log('[BrokerAdapter] cancelOrders() called:', symbol, side, ordersIds);
        const promises = ordersIds.map(id => this.cancelOrder(id));
        await Promise.all(promises);
    }

    // --- Positions ----------------------------------------------------------
    async positions() {
        const wsPositions = webSocketManager.getPositions(this._brokerId, String(this._accountId));
        console.log('[BrokerAdapter] positions() called — raw WS positions:', wsPositions.length, wsPositions.map(p => ({ positionId: p.positionId, symbol: p.symbol, contractId: p.contractId, netPos: p.netPos })));
        const filtered = wsPositions
            .filter(p => (p.netPos || 0) !== 0)
            .map(p => this._transformPosition(p));
        console.log('[BrokerAdapter] positions() returning:', filtered.length, 'open positions', filtered);
        return filtered;
    }

    async closePosition(positionId, amount) {
        console.log('[BrokerAdapter] closePosition() called:', positionId, 'amount:', amount);
        try {
            await this._api('POST',
                `/api/v1/brokers/accounts/${this._accountId}/positions/${positionId}/close`
            );
            this._host.showNotification('Position Closed', `Position closed successfully`, 0);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message;
            this._host.showNotification(
                'Close Failed',
                errorMsg,
                1
            );
            throw err;
        }
    }

    async reversePosition(positionId) {
        console.log('[BrokerAdapter] reversePosition() called:', positionId);
        try {
            await this._api('POST',
                `/api/v1/brokers/accounts/${this._accountId}/positions/${positionId}/reverse`
            );
            this._host.showNotification('Position Reversed', `Position reversed successfully`, 0);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message;
            this._host.showNotification(
                'Reverse Failed',
                errorMsg,
                1
            );
            throw err;
        }
    }

    // --- Instrument Info ----------------------------------------------------
    symbolInfo(symbol) {
        console.log('[BrokerAdapter] symbolInfo() called for:', symbol);
        const displaySymbol = getDisplayTicker(symbol);
        const config = SYMBOL_CONFIG[displaySymbol] || SYMBOL_CONFIG['ES'];
        const tickSize = config.minmov / config.pricescale;

        return Promise.resolve({
            qty: { min: 1, max: 1000, step: 1, default: 1 },
            pipSize: tickSize,
            pipValue: config.pointvalue * tickSize,
            minTick: tickSize,
            description: config.description || displaySymbol,
        });
    }

    // --- Order Ticket Config ------------------------------------------------
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

    executions(symbol) {
        return Promise.resolve([]);
    }

    // --- Real-time / DOM (stubs) --------------------------------------------
    subscribeRealtime(symbol) {}
    unsubscribeRealtime(symbol) {}
    subscribeDOM(symbol, callback) {}
    unsubscribeDOM(symbol) {}

    // --- Cleanup ------------------------------------------------------------
    destroy() {
        console.log('[BrokerAdapter] destroy() called — cleaning up');
        // Remove all WebSocket listeners
        this._listeners.forEach(({ event, handler }) => {
            webSocketManager.removeListener(event, handler);
        });
        this._listeners = [];
    }

    // --- Internal Helpers ---------------------------------------------------

    _loadAccountName() {
        const data = webSocketManager.getAccountData(this._brokerId, String(this._accountId));
        this._accountName = data?.name || data?.nickname || 'Trading Account';
    }

    _updateAccountSummary() {
        const data = webSocketManager.getAccountData(this._brokerId, String(this._accountId));
        if (data) {
            this._balanceWV.setValue(data.balance || data.cashBalance || 0);
            this._plWV.setValue(data.unrealizedPnL || data.openPL || 0);
            this._equityWV.setValue(data.equity || ((data.balance || 0) + (data.unrealizedPnL || 0)));
        }
    }

    _setupWebSocketListeners() {
        console.log('[BrokerAdapter] Setting up WebSocket listeners for account:', this._accountId, 'broker:', this._brokerId);

        // Position updates from WebSocket -> TradingView
        const handlePositionUpdate = (data) => {
            if (String(data.accountId) !== String(this._accountId)) return;
            if (data.brokerId && data.brokerId !== this._brokerId) return;

            console.log('[BrokerAdapter] positionUpdate event received:', data.type, 'accountId:', data.accountId);

            // Update account summary values (balance/PnL change with positions)
            this._updateAccountSummary();

            // Rebuild all positions and push to TradingView
            const wsPositions = webSocketManager.getPositions(this._brokerId, String(this._accountId));
            wsPositions.forEach(p => {
                if ((p.netPos || 0) !== 0) {
                    this._host.positionUpdate(this._transformPosition(p));
                }
            });

            // Handle closed positions (netPos = 0) - tell TV to remove them
            if (data.type === 'closed' && data.position) {
                // Use symbol string, not numeric contractId
                const displaySymbol = getDisplayTicker(data.position.symbol || '');
                this._host.positionUpdate({
                    id: String(data.position.positionId || data.position.id || data.position.contractId),
                    symbol: displaySymbol,
                    qty: 0,
                    side: 1,
                    avgPrice: 0,
                    pl: 0,
                });
            }
        };

        // Order updates from WebSocket -> TradingView
        const handleOrderUpdate = (data) => {
            if (String(data.accountId) !== String(this._accountId)) return;
            if (data.brokerId && data.brokerId !== this._brokerId) return;

            console.log('[BrokerAdapter] orderUpdate event received:', data.type, 'accountId:', data.accountId);

            // Rebuild all orders and push to TradingView
            const wsOrders = webSocketManager.getOrders(this._brokerId, String(this._accountId));
            wsOrders.forEach(o => {
                this._host.orderUpdate(this._transformOrder(o));
            });
        };

        // Connection state changes
        const handleConnectionState = (data) => {
            if (String(data.accountId) !== String(this._accountId)) return;

            let tvState;
            switch (data.state) {
                case 'connected':
                case 'ready':
                    tvState = ConnectionStatus.Connected;
                    break;
                case 'connecting':
                case 'reconnecting':
                case 'validating_user':
                case 'checking_subscription':
                case 'checking_broker_access':
                case 'connecting_to_broker':
                    tvState = ConnectionStatus.Connecting;
                    break;
                case 'error':
                    tvState = ConnectionStatus.Error;
                    break;
                default:
                    tvState = ConnectionStatus.Disconnected;
            }
            this._host.connectionStatusUpdate(tvState);
        };

        webSocketManager.on('positionUpdate', handlePositionUpdate);
        webSocketManager.on('orderUpdate', handleOrderUpdate);
        webSocketManager.on('connectionState', handleConnectionState);

        // Track listeners for cleanup
        this._listeners.push(
            { event: 'positionUpdate', handler: handlePositionUpdate },
            { event: 'orderUpdate', handler: handleOrderUpdate },
            { event: 'connectionState', handler: handleConnectionState },
        );
    }

    _transformPosition(wsPos) {
        // Use symbol string (e.g. "NQH6") for display ticker resolution, NOT contractId (numeric Tradovate ID)
        const displaySymbol = getDisplayTicker(wsPos.symbol || '');
        const netPos = wsPos.netPos || wsPos.qty || 0;

        const transformed = {
            id: String(wsPos.positionId || wsPos.id || wsPos.contractId),
            symbol: displaySymbol,
            qty: Math.abs(netPos),
            side: netPos > 0 ? 1 : -1,
            avgPrice: wsPos.netPrice || wsPos.avgPrice || 0,
            pl: wsPos.unrealizedPnL || wsPos.pl || 0,
        };
        console.log('[BrokerAdapter] _transformPosition:', wsPos.symbol, '→', displaySymbol, transformed);
        return transformed;
    }

    _transformOrder(wsOrder) {
        // Use symbol string (e.g. "NQH6") for display ticker resolution, NOT contractId (numeric Tradovate ID)
        const displaySymbol = getDisplayTicker(wsOrder.symbol || '');

        const transformed = {
            id: String(wsOrder.orderId || wsOrder.id),
            symbol: displaySymbol,
            type: mapOrderType(wsOrder.orderType || 'Market'),
            side: mapSide(wsOrder.action || wsOrder.side),
            qty: wsOrder.orderQty || wsOrder.qty || 0,
            limitPrice: wsOrder.price || wsOrder.limitPrice || undefined,
            stopPrice: wsOrder.stopPrice || undefined,
            status: mapOrderStatus(wsOrder.orderStatus || wsOrder.status || 'Working'),
            filledQty: wsOrder.filledQty || 0,
            avgPrice: wsOrder.avgFillPrice || wsOrder.avgPrice || 0,
            duration: { type: wsOrder.timeInForce || 'GTC' },
            updateTime: wsOrder.timestamp ? wsOrder.timestamp / 1000 : Date.now() / 1000,
        };
        console.log('[BrokerAdapter] _transformOrder:', wsOrder.symbol, '→', displaySymbol, transformed);
        return transformed;
    }

    async _api(method, path, data) {
        const token = this._getToken();
        return axios({
            method,
            url: `${API_BASE}${path}`,
            data,
            headers: { Authorization: `Bearer ${token}` },
        });
    }
}
