import { ConfigService } from './config.service';

describe('ConfigService', () => {
    let configService: ConfigService<{ apiEndpoint: string; featureFlags?: { enableLogging?: boolean } }>;
    const localConfig = { apiEndpoint: 'http://localhost', featureFlags: { enableLogging: false } };

    beforeEach(() => {
        configService = new ConfigService(localConfig);
        global.fetch = jest.fn();
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
        expect(configService.getProperty('apiEndpoint')).toBe('http://localhost');
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

        expect(configService.get('bgl-analytics.activated')).toBe(true);
        expect(configService.get('bgl-analytics.unknown', 'defaultParam')).toBe('defaultParam');
        expect(configService.get('invalidKey')).toBeUndefined();
    });
});
