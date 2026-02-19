/**
 * Factory function that TradingView calls to create the broker adapter.
 * Passed to the widget as the `broker_factory` option.
 *
 * TradingView expects broker_factory to be a FUNCTION: (host) => IBrokerTerminal
 * NOT an object with createBroker/createDelegate methods.
 */
import { AtomikBrokerAdapter } from './AtomikBrokerAdapter';

/**
 * Creates a broker factory function for TradingView's trading terminal.
 *
 * @param {Object} config
 * @param {string} config.accountId - Currently selected broker account ID
 * @param {string} config.brokerId - Broker identifier (e.g. 'tradovate')
 * @param {Function} config.getAccessToken - Returns JWT token string
 * @param {Function} [config.onOrderPlaced] - Optional callback when order is placed
 * @param {Function} [config.onError] - Optional callback on error
 * @returns {Function} A function (host) => IBrokerTerminal that TradingView calls
 */
export function createAtomikBrokerFactory(config) {
    console.log('[BrokerFactory] createAtomikBrokerFactory called — accountId:', config.accountId, 'brokerId:', config.brokerId);

    // TradingView calls this function with (host: IBrokerConnectionAdapterHost)
    // and expects an IBrokerTerminal object back
    return function brokerFactory(host) {
        console.log('[BrokerFactory] broker_factory called by TradingView — instantiating AtomikBrokerAdapter');
        return new AtomikBrokerAdapter(host, config);
    };
}
