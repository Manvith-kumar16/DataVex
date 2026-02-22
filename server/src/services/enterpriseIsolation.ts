import { evaluateEnterpriseContext, EnterpriseSignals } from '../scoring/enterpriseConstraint';
import { fetchCompanySignals } from './searchProvider';
import { extractSignals } from './signalExtractor';

export interface EnterpriseIsolationResult {
    isEnterprise: boolean;
    category?: string;
    explanation?: string;
}

export type EnterpriseMode = 'hard-stop' | 'soft-warning';
export const ENTERPRISE_MODE: EnterpriseMode = 'hard-stop';

/**
 * Checks if a domain qualifies for Enterprise Isolation.
 * Now performs a real-time "Scale Probe" via search providers.
 */
export async function checkEnterpriseIsolation(domain: string): Promise<EnterpriseIsolationResult> {
    // 1. Perform a quick, targeted identity probe
    const searchResults = await fetchCompanySignals(domain);

    if (searchResults.length === 0) {
        // If no web presence at all, it's definitely not a mega-enterprise.
        return { isEnterprise: false };
    }

    const { fundingSignals, hiringSignals, techClues } = extractSignals(searchResults, domain);

    // 2. Synthesize signals into Scale Intelligence
    const allText = [...fundingSignals, ...hiringSignals, ...techClues].join(' ').toLowerCase();

    // Heuristic: Estimate employee count and capability maturity from signals
    const signals: EnterpriseSignals = {
        // If "Global", "Fortune 500", or "Mega" are mentioned in the lead snippets
        employeeCount: allText.includes('10,000+') || allText.includes('fortune 500') ? 10000 : 1000,
        hasInternalAI: allText.includes('internal ai lab') || allText.includes('proprietary machine learning'),
        hasInternalDevOps: allText.includes('internal platform engineering') || allText.includes('custom devops stack'),
        industry: 'Detected via Probe'
    };

    const penalty = evaluateEnterpriseContext(domain, signals);

    if (penalty) {
        return {
            isEnterprise: true,
            category: 'Strategic Target Isolation',
            explanation: penalty.reason
        };
    }

    return { isEnterprise: false };
}
