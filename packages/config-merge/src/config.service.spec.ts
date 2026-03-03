import { ConfigService } from './config.service';

describe('ConfigService', () => {
    let configService: ConfigService<{ apiEndpoint: string; featureFlags?: { enableLogging?: boolean } }>;
    const localConfig = { apiEndpoint: 'http://localhost', featureFlags: { enableLogging: false } };

    beforeEach(() => {
        configService = new ConfigService(localConfig);
        global.fetch = jest.fn();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should initialize with local configuration', () => {
        // Since loadAndMerge hasn't been called, it should throw or we can test loadAndMerge falls back
        configService.loadAndMerge('http://fake').then(() => {
            expect(configService.getConfig()).toEqual(localConfig);
        });
    });

    it('should initialize with app metadata and local configuration', () => {
        const metadata = { name: 'my-app', version: '1.0.0', component: { id: 'app1' } };
        const serviceWithMeta = new ConfigService(localConfig, metadata);
        expect(serviceWithMeta.getConfig()).toEqual({ ...metadata, ...localConfig });
        expect(serviceWithMeta.get('name')).toBe('my-app');
        expect(serviceWithMeta.get('component.id')).toBe('app1');
    });

    it('should merge remote config overrides', async () => {
        const remoteConfig = { apiEndpoint: 'https://prod.api', featureFlags: { enableLogging: true } };

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => remoteConfig,
        });

        const mergedConfig = await configService.loadAndMerge('http://fake-remote.json');

        expect(mergedConfig.apiEndpoint).toBe('https://prod.api');
        expect(mergedConfig.featureFlags?.enableLogging).toBe(true);
        expect(configService.getConfig()).toEqual(mergedConfig);
    });

    it('should retain app metadata after merging remote config overrides', async () => {
        const metadata = { name: 'my-app', version: '1.0.0' };
        const serviceWithMeta = new ConfigService(localConfig, metadata);

        const remoteConfig = { apiEndpoint: 'https://prod.api' };
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => remoteConfig,
        });

        const mergedConfig = await serviceWithMeta.loadAndMerge('http://fake-remote.json');

        expect(mergedConfig).toEqual({ ...metadata, ...localConfig, ...remoteConfig });
        expect(serviceWithMeta.get('name')).toBe('my-app');
        expect(serviceWithMeta.get('apiEndpoint')).toBe('https://prod.api');
    });

    it('should fallback to local config on failed fetch', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 404
        });

        const mergedConfig = await configService.loadAndMerge('http://fake-remote.json');
        expect(mergedConfig).toEqual(localConfig);
    });

    it('should fallback to local config on network error', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        const mergedConfig = await configService.loadAndMerge('http://fake-remote.json');
        expect(mergedConfig).toEqual(localConfig);
    });

    it('should return local property before load', () => {
        expect(configService.get('apiEndpoint')).toBe('http://localhost');
    });

    it('should return local deep property before load', () => {
        expect(configService.get('featureFlags.enableLogging')).toBe(false);
    });

    it('should return nested property via get() method', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ 'bgl-analytics': { activated: true } }),
        });
        await configService.loadAndMerge('http://fake-remote.json');

        expect(configService.get('bgl-analytics.activated' as any)).toBe(true);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Accessed property 'bgl-analytics.activated'"), true);

        expect(configService.get('bgl-analytics.unknown' as any, 'defaultParam')).toBe('defaultParam');
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Property 'bgl-analytics.unknown' not found"), 'defaultParam');

        expect(configService.get('invalidKey' as any)).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Property 'invalidKey' not found"), undefined);
    });
});
