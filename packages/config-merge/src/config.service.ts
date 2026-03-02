/**
 * Deep merges two objects.
 * Simple implementation for merging configuration objects.
 */
function isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep<T>(target: T, ...sources: any[]): T {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!(target as any)[key]) Object.assign(target as any, { [key]: {} });
                mergeDeep((target as any)[key], source[key]);
            } else {
                Object.assign(target as any, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

export class ConfigService<T extends object> {
    private config: T | null = null;

    constructor(private localEnvironmentConfig: T) {
        this.config = { ...localEnvironmentConfig };
    }

    /**
     * Fetches the remote configuration from the given URL and merges it with the local configuration.
     * Remote configuration overrides local configuration fields.
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
            this.config = mergeDeep({} as T, this.localEnvironmentConfig, remoteConfig);
            return this.config;
        } catch (error) {
            console.error(`[ConfigService] Error fetching remote config:`, error);
            return this.config as T; // Fallback to local
        }
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
