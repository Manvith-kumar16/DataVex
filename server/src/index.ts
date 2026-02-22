import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import analyzeRouter from './routes/analyze';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting: 10 requests per minute
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Routes
app.use('/api', analyzeRouter);

// Root Welcome
app.get('/', (req, res) => {
    res.json({
        message: 'DataVex Production API is running.',
        endpoints: ['/api/analyze (POST)', '/health (GET)']
    });
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`[Server] DataVex Production Backend running on port ${port}`);
});
