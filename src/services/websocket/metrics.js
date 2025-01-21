export class HeartbeatMetrics {
    constructor() {
        this.totalHeartbeats = 0;
        this.missedHeartbeats = 0;
        this.averageLatency = 0;
        this.lastSuccessful = Date.now();
        this.lastFailure = null;
        this.reconnectionAttempts = 0;
    }

    getHealthScore() {
        if (this.totalHeartbeats === 0) return 0;
        return 1 - (this.missedHeartbeats / this.totalHeartbeats);
    }

    reset() {
        this.missedHeartbeats = 0;
        this.reconnectionAttempts = 0;
    }
}