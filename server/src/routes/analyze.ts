import { Router } from 'express';
import { runServerAnalysis } from '../lib/orchestrator';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const router = Router();

const AnalyzeSchema = z.object({
    domain: z.string().min(1)
});

const MEMORY_FILE = path.join(__dirname, '../memory/executionTrace.jsonl');

router.post('/analyze', async (req, res) => {
    try {
        const { domain } = AnalyzeSchema.parse(req.body);

        console.log(`[API] Starting analysis for: ${domain}`);
        const result = await runServerAnalysis(domain);

        // Write to execution trace memory
        const trace = {
            timestamp: new Date().toISOString(),
            task_id: result.id,
            domain: domain,
            leadScore: result.score.leadScore,
            verdict: result.verdict.action,
            event_type: 'ANALYSIS_COMPLETE'
        };

        fs.appendFileSync(MEMORY_FILE, JSON.stringify(trace) + '\n');

        res.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid domain' });
        }
        console.error('[API] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
