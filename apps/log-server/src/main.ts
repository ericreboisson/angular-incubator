import express from 'express';
import cors from 'cors';

export const app = express();
const port = process.env.PORT || 3000;

// Allow CORS for the Angular app running on localhost:420x
app.use(cors());
app.use(express.json());

// Endpoint to receive logs from HttpLoggerService
app.post('/logs', (req, res) => {
    const log = req.body;

    if (!log) {
        res.status(400).send({ error: 'No body provided' });
        return;
    }

    const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

    console.log(`\n================= NEW HTTP LOG RECEIVED =================`);
    console.log(`⏱️  Time:    ${timestamp}`);
    console.log(`🏷️  Level:   [${log.level?.toUpperCase() || 'UNKNOWN'}]`);
    console.log(`💬 Message: ${log.message}`);

    if (log.context) {
        console.log(`📦 Context: `, log.context);
    }
    console.log(`=========================================================\n`);

    res.status(200).send({ status: 'Log saved successfully' });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`🚀 Log Server is running and listening on http://localhost:${port}`);
        console.log(`➡️  Waiting for logs from Angular App on POST http://localhost:${port}/logs...`);
    });
}
