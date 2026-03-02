import { ConfigService } from './config.service';

/**
 * A generic HTTP logger service that posts logs to a remote endpoint.
 * Requires a ConfigService to determine the API endpoint and whether logging is enabled.
 */
export class HttpLoggerService<T extends { apiEndpoint: string; featureFlags?: { enableLogging?: boolean } }> {
    constructor(private configService: ConfigService<T>) { }

    /**
     * Sends a log record to the server if logging is enabled in the configuration.
     * @param level The log level (e.g., 'info', 'warn', 'error').
     * @param message The log message.
     * @param context Additional context data object.
     */
    async log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, any>): Promise<void> {
        const config = this.configService.getConfig();

        // Check if logging is enabled via feature flag (defaults to false if not explicitly set)
        if (!config.featureFlags?.enableLogging) {
            console.log(`[HttpLoggerService] Logging disabled. Skipping log: [${level}] ${message}`);
            return;
        }

        const payload = {
            level,
            message,
            context,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch(`${config.apiEndpoint}/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.warn(`[HttpLoggerService] Failed to send log to ${config.apiEndpoint}/logs. Status: ${response.status}`);
            }
        } catch (error) {
            console.error(`[HttpLoggerService] Error sending log HTTP request:`, error);
        }
    }

    info(message: string, context?: Record<string, any>) {
        return this.log('info', message, context);
    }

    warn(message: string, context?: Record<string, any>) {
        return this.log('warn', message, context);
    }

    error(message: string, context?: Record<string, any>) {
        return this.log('error', message, context);
    }
}
