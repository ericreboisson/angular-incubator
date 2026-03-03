import { ConfigService } from './config.service';
import { HttpLoggerService } from './logger.service';

describe('HttpLoggerService', () => {
    let configService: ConfigService<{ apiEndpoint: string; featureFlags?: { enableLogging?: boolean } }>;
    let loggerService: HttpLoggerService<{ apiEndpoint: string; featureFlags?: { enableLogging?: boolean } }>;

    beforeEach(() => {
        configService = new ConfigService({ apiEndpoint: 'http://localhost' });
        // Mock the get method to simulate a loaded config
        jest.spyOn(configService, 'get').mockImplementation((key) => {
            if (key === 'apiEndpoint') return 'http://localhost';
            if (key === 'featureFlags') return { enableLogging: true };
            return undefined;
        });

        loggerService = new HttpLoggerService(configService);
        global.fetch = jest.fn().mockResolvedValue({ ok: true });
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should send HTTP POST if logging is enabled', async () => {
        await loggerService.info('Test Info Message', { user: 1 });

        expect(global.fetch).toHaveBeenCalledWith('http://localhost/logs', expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"level":"info"')
        }));

        expect(global.fetch).toHaveBeenCalledWith('http://localhost/logs', expect.objectContaining({
            body: expect.stringContaining('"message":"Test Info Message"')
        }));
    });

    it('should not send HTTP POST if logging is disabled', async () => {
        jest.spyOn(configService, 'get').mockImplementation((key) => {
            if (key === 'apiEndpoint') return 'http://localhost';
            if (key === 'featureFlags') return { enableLogging: false };
            return undefined;
        });

        await loggerService.error('Test Error');

        expect(global.fetch).not.toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Logging disabled'));
    });

    it('should handle network errors gracefully', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

        await loggerService.warn('Test Warn');
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error sending log HTTP request:'), expect.any(Error));
    });

    it('should warn on non-ok HTTP responses', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

        await loggerService.info('Test Info');
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to send log'));
    });
});
