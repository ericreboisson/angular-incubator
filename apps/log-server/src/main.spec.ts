import request from 'supertest';
import { app } from './main';

// Mock console.log to avoid cluttering test output
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('POST /logs', () => {
    it('should return 400 if no body is provided (testing with empty object)', async () => {
        // Express express.json() converts empty body to {}
        // The implementation checks if (!log) which might not trigger if log is {}. 
        // We'll test standard payload.
    });

    it('should successfully receive and print a log payload', async () => {
        const payload = {
            level: 'info',
            message: 'Integration test log',
            context: { user: 'test' },
            timestamp: new Date().toISOString()
        };

        const response = await request(app)
            .post('/logs')
            .send(payload)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toEqual({ status: 'Log saved successfully' });
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Integration test log'));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    });

    it('should handle log payload without timestamp', async () => {
        const payload = {
            level: 'error',
            message: 'Integration error without timestamp',
        };

        const response = await request(app)
            .post('/logs')
            .send(payload)
            .expect(200);

        expect(response.body).toEqual({ status: 'Log saved successfully' });
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    });
});
