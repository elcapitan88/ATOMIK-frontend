/**
 * AtomikBrokerAdapter
 *
 * Implements TradingView's IBrokerTerminal interface.
 * Bridges between TradingView's trading terminal and our backend REST API + WebSocket data.
 *
 * Orders -> Backend REST API (validation, execution, trade recording)
 * Real-time updates -> WebSocketManager (positions, orders, account data)
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
        this._host = host;
        this._accountId = config.accountId;
        this._brokerId = config.brokerId || 'tradovate';
        this._getToken = config.getAccessToken;
        this._onOrderPlaced = config.onOrderPlaced;
        this._onError = config.onError;
        this._accountName = '';
        this._listeners = [];

        // Set up WebSocket listeners for real-time updates
        this._setupWebSocketListeners();

        // Load initial account name
        this._loadAccountName();

        // Tell TradingView we're connected (after a brief delay to let WS sync)
        setTimeout(() => {
            host.connectionStatusUpdate(ConnectionStatus.Connected);
        }, 500);
    }

    // --- Connection ---------------------------------------------------------
    connectionStatus() {
        return ConnectionStatus.Connected;
    }

    // --- Accounts -----------------------------------------------------------
    accounts() {
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
    }

    async accountInfo() {
        const data = webSocketManager.getAccountData(this._brokerId, String(this._accountId));
        return {
            id: String(this._accountId),
            name: this._accountName || 'Trading Account',
            currency: 'USD',
            balance: data?.balance || data?.cashBalance || 0,
            pl: data?.unrealizedPnL || data?.openPL || 0,
            equity: data?.equity || ((data?.balance || 0) + (data?.unrealizedPnL || 0)),
        };
    }

    async accountsInfo() {
        const info = await this.accountInfo();
        return [info];
    }

    // --- Orders -------------------------------------------------------------
    async orders() {
        const wsOrders = webSocketManager.getOrders(this._brokerId, String(this._accountId));
        return wsOrders
            .filter(o => {
                const status = mapOrderStatus(o.orderStatus || o.status);
                // Only return working/placing orders (not filled/canceled)
                return status === OrderStatus.Working || status === OrderStatus.Placing;
            })
            .map(o => this._transformOrder(o));
    }

    async placeOrder(preOrder) {
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

            return orderId;
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

    async modifyOrder(orderId, modifications) {
        const payload = {};
        if (modifications.qty != null) payload.qty = modifications.qty;
        if (modifications.limitPrice != null) payload.limitPrice = modifications.limitPrice;
        if (modifications.stopPrice != null) payload.stopPrice = modifications.stopPrice;

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

    // --- Positions ----------------------------------------------------------
    async positions() {
        const wsPositions = webSocketManager.getPositions(this._brokerId, String(this._accountId));
        return wsPositions
            .filter(p => (p.netPos || 0) !== 0) // Only non-flat positions
            .map(p => this._transformPosition(p));
    }

    async closePosition(positionId) {
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

    _setupWebSocketListeners() {
        // Position updates from WebSocket -> TradingView
        const handlePositionUpdate = (data) => {
            if (String(data.accountId) !== String(this._accountId)) return;
            if (data.brokerId && data.brokerId !== this._brokerId) return;

            // Rebuild all positions and push to TradingView
            const wsPositions = webSocketManager.getPositions(this._brokerId, String(this._accountId));
            wsPositions.forEach(p => {
                if ((p.netPos || 0) !== 0) {
                    this._host.positionUpdate(this._transformPosition(p));
                }
            });

            // Handle closed positions (netPos = 0) - tell TV to remove them
            if (data.type === 'closed' && data.position) {
                const displaySymbol = getDisplayTicker(data.position.contractId || data.position.symbol || '');
                this._host.positionUpdate({
                    id: String(data.position.id || data.position.contractId),
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
        const displaySymbol = getDisplayTicker(wsPos.contractId || wsPos.symbol || '');
        const netPos = wsPos.netPos || wsPos.qty || 0;

        return {
            id: String(wsPos.id || wsPos.contractId),
            symbol: displaySymbol,
            qty: Math.abs(netPos),
            side: netPos > 0 ? 1 : -1,
            avgPrice: wsPos.netPrice || wsPos.avgPrice || 0,
            pl: wsPos.unrealizedPnL || wsPos.pl || 0,
        };
    }

    _transformOrder(wsOrder) {
        const displaySymbol = getDisplayTicker(wsOrder.contractId || wsOrder.symbol || '');

        return {
            id: String(wsOrder.id || wsOrder.orderId),
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
