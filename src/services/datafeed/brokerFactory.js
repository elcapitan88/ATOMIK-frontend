/**
 * Factory function that TradingView calls to create the broker adapter.
 * Passed to the widget as the `broker_factory` option.
 */
import { AtomikBrokerAdapter } from './AtomikBrokerAdapter';

/**
 * Creates a broker factory for TradingView's trading terminal.
 *
 * @param {Object} config
 * @param {string} config.accountId - Currently selected broker account ID
 * @param {string} config.brokerId - Broker identifier (e.g. 'tradovate')
 * @param {Function} config.getAccessToken - Returns JWT token string
 * @param {Function} [config.onOrderPlaced] - Optional callback when order is placed
 * @param {Function} [config.onError] - Optional callback on error
 */
export function createAtomikBrokerFactory(config) {
    console.log('[BrokerFactory] createAtomikBrokerFactory called — accountId:', config.accountId, 'brokerId:', config.brokerId);
    return {
        createDelegate: () => {
            console.log('[BrokerFactory] createDelegate called by TradingView');
            return Promise.resolve({
                isTradable: (symbol) => Promise.resolve(true),
                buttonDropdownActions: undefined,
                chartContextMenuActions: undefined,
                plOrdersContextMenuActions: undefined,
                possibleOrderTypes: undefined,
            });
        },
        createLoginButtonActions: undefined,
        createBroker: (host) => {
            console.log('[BrokerFactory] createBroker called by TradingView — instantiating AtomikBrokerAdapter');
            return new AtomikBrokerAdapter(host, config);
        },
    };
}
