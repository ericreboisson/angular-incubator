export interface AppMetadata {
    name?: string;
    version?: string;
    component?: {
        id?: string;
    };
}

/**
 * Generates all valid dot-notation paths for a given configuration object.
 * For example: 'featureFlags' | 'featureFlags.enableLogging'
 */
export type Paths<T> = T extends object
    ? {
        [K in keyof T & string]: NonNullable<T[K]> extends Record<string, any>
        ? K | `${K}.${Paths<NonNullable<T[K]>>}`
        : K
    }[keyof T & string]
    : never;

/**
 * Extracts the specific type at a given dot-notation path.
 */
export type TypeFromPath<T, Path extends string> =
    Path extends keyof T ? T[Path] :
    Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
    ? TypeFromPath<NonNullable<T[Key]>, Rest>
    : never
    : never;

function isObject(item: any): item is Record<string, any> {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMerge<T extends Record<string, any>>(target: T, ...sources: Record<string, any>[]): T {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return deepMerge(target, ...sources);
}

export class ConfigService<T extends object> {
    private config: T | null = null;

    constructor(
        private localEnvironmentConfig: T,
        private appMetadata?: AppMetadata
    ) {
        this.config = deepMerge({}, this.appMetadata || {}, localEnvironmentConfig) as T;
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

            // Deep merge: App metadata first, Environment next, then remote overrides
            this.config = deepMerge({}, this.appMetadata || {}, this.localEnvironmentConfig, remoteConfig) as T;

            return this.config;
        } catch (error) {
            console.error(`[ConfigService] Error fetching remote config:`, error);
            return this.config as T; // Fallback to local
        }
    }

    /**
     * Retrieves a deeply nested value from the configuration using a dot-notation path.
     * Useful for accessing dynamic keys like 'featureFlags.enableLogging'.
     * Logs accesses and missing properties to inform the user.
     * 
     * @param path The dot-separated path to the property (e.g., 'component.id')
     * @param defaultValue Optional default value if the property is undefined
     * @returns The value at the specified path, or the default value
     */
    get<
        Path extends Paths<T & AppMetadata>,
        V = TypeFromPath<T & AppMetadata, Path>
    >(path: Path, defaultValue?: V): V | undefined {
        const keys = (path as string).split('.');
        let current: any = this.config;

        for (const key of keys) {
            if (current === undefined || current === null) {
                console.warn(`[ConfigService] Property '${path}' not found. Returning default value:`, defaultValue);
                return defaultValue;
            }
            current = current[key];
        }

        if (current !== undefined) {
            console.log(`[ConfigService] Accessed property '${path}':`, current);
            return current;
        }

        console.warn(`[ConfigService] Property '${path}' not found. Returning default value:`, defaultValue);
        return defaultValue;
    }

    /**
     * Returns the current merged configuration.
     */
    getConfig(): T {
        return this.config as T;
    }
}
