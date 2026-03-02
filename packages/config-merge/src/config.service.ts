export class ConfigService<T extends object> {
    private config: T | null = null;

    constructor(private localEnvironmentConfig: T) {
        this.config = { ...localEnvironmentConfig };
    }

    /**
     * Fetches the remote configuration from the given URL and merges it with the local configuration.
     * Remote configuration overrides local configuration fields (shallow merge).
     * 
     * @param remoteConfigUrl The URL pointing to a JSON configuration file.
     * @returns A promise resolving to the fully merged configuration.
     */
    async loadAndMerge(remoteConfigUrl: string): Promise<T> {
        try {
            const response = await fetch(remoteConfigUrl);
            if (!response.ok) {
                console.warn(`[ConfigService] Could not fetch remote config from ${remoteConfigUrl}. Status: ${response.status}`);
                return this.config as T;
            }
            const remoteConfig = await response.json();

            // Shallow object spread: Environment first, then remote overrides
            this.config = { ...this.localEnvironmentConfig, ...remoteConfig } as T;

            return this.config;
        } catch (error) {
            console.error(`[ConfigService] Error fetching remote config:`, error);
            return this.config as T; // Fallback to local
        }
    }

    /**
     * Retrieves a specific top-level property from the configuration in a type-safe manner.
     * 
     * @param key The property key to retrieve from the configuration object.
     * @returns The value of the property, or undefined if it does not exist.
     */
    getProperty<K extends keyof T>(key: K): T[K] | undefined {
        return this.config ? this.config[key] : undefined;
    }

    /**
     * Retrieves a deeply nested value from the configuration using a dot-notation path.
     * Useful for accessing dynamic keys like 'bgl-analytics.activated'.
     * 
     * @param path The dot-separated path to the property (e.g., 'bgl-analytics.activated')
     * @param defaultValue Optional default value if the property is undefined
     * @returns The value at the specified path, or the default value
     */
    get<V = any>(path: string, defaultValue?: V): V | undefined {
        const keys = path.split('.');
        let current: any = this.config;

        for (const key of keys) {
            if (current === undefined || current === null) {
                return defaultValue;
            }
            current = current[key];
        }

        return current !== undefined ? current : defaultValue;
    }

    /**
     * Returns the current merged configuration.
     */
    getConfig(): T {
        return this.config as T;
    }
}
