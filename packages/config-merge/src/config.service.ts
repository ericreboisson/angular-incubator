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
     * Retrieves a specific property from the configuration in a type-safe manner.
     * Use this instead of `(config as any).property`.
     * 
     * @param key The property key to retrieve from the configuration object.
     * @returns The value of the property, or undefined if it does not exist.
     */
    getProperty<K extends keyof T>(key: K): T[K] | undefined {
        if (!this.config) {
            console.warn(`ConfigService: Configuration not loaded. Cannot get property '${String(key)}'`);
            return undefined;
        }
        return this.config[key];
    }

    /**
     * Returns the current merged configuration.
     * Throws an error if accessed before `loadAndMerge` has completed successfully.
     */
    getConfig(): T {
        if (!this.config) {
            throw new Error("ConfigService: Configuration has not been loaded yet.");
        }
        return this.config;
    }
}
