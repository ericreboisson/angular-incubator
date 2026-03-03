import { ConfigService } from './config.service';

export class HttpLoggerService<T extends object> {
    constructor(private configService: ConfigService<T>) { }

    /**
     * Sends an info log to the server.
     */
    async info(message: string, context?: Record<string, any>): Promise<void> {
        return this.log('info', message, context);
    }

    /**
     * Sends a warning log to the server.
     */
    async warn(message: string, context?: Record<string, any>): Promise<void> {
        return this.log('warn', message, context);
    }

    /**
     * Sends an error log to the server.
     */
    async error(message: string, context?: Record<string, any>): Promise<void> {
        return this.log('error', message, context);
    }

    /**
     * Internal method to construct and send the log payload via HTTP POST.
     */
    private async log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, any>): Promise<void> {
        const featureFlags = this.configService.get('featureFlags');
        const apiEndpoint = this.configService.get('apiEndpoint');

        if (!featureFlags?.enableLogging) {
            console.log(`[HttpLoggerService] Logging disabled for: [${level.toUpperCase()}] ${message}`);
            return;
        }

        if (!apiEndpoint || typeof apiEndpoint !== 'string') {
            console.warn('[HttpLoggerService] Cannot send log: apiEndpoint is not defined or is not a string in configuration.');
            return;
        }

        const payload = {
            level,
            message,
            context,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch(`${apiEndpoint}/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.warn(`[HttpLoggerService] Failed to send log. Server responded with status: ${response.status}`);
            }
        } catch (error) {
            console.error('[HttpLoggerService] Error sending log HTTP request:', error);
        }
    }
}
