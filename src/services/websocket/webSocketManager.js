// Temporary stub implementation
const webSocketManager = {
  connect: () => Promise.resolve(true),
  disconnect: () => {},
  onStatus: () => ({
    subscribe: () => ({
      unsubscribe: () => {}
    })
  }),
  onAccountUpdates: () => ({
    subscribe: () => ({
      unsubscribe: () => {}
    })
  })
};

export default webSocketManager;
