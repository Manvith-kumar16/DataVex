/**
 * server/src/scoring/enterpriseConstraint.ts
 * 
 * Logic to determine if a company should be isolated based on scale 
 * and internal capabilities rather than a static list.
 */

export interface EnterprisePenalty {
    score: number;
    reason: string;
}

// Companies that are direct competitors or obvious giants where DataVex is never a fit.
const MINIMAL_COMPETITOR_LIST: Record<string, string> = {
    'microsoft.com': 'Direct Platform Competitor',
    'google.com': 'Direct Platform Competitor',
    'amazon.com': 'Direct Platform Competitor',
    'aws.amazon.com': 'Direct Platform Competitor',
    'salesforce.com': 'Enterprise Platform Giant',
    'openai.com': 'AI Core Infrastructure Provider',
};

export interface EnterpriseSignals {
    employeeCount?: number;
    hasInternalAI?: boolean;
    hasInternalDevOps?: boolean;
    isFortune500?: boolean;
    industry?: string;
}

/**
 * Dynamic evaluation of enterprise isolation.
 * Isolates companies that are too large or have deep internal 
 * capabilities that make DataVex services redundant.
 */
export function evaluateEnterpriseContext(domain: string, signals: EnterpriseSignals): EnterprisePenalty | null {
    const normalizedDomain = domain.toLowerCase().trim();

    // 1. Check direct competitor list
    if (MINIMAL_COMPETITOR_LIST[normalizedDomain]) {
        return {
            score: 0,
            reason: `DataVex Isolation: ${MINIMAL_COMPETITOR_LIST[normalizedDomain]} — This organization is a core infrastructure provider with proprietary toolchains. External intelligence services are strategically incompatible.`,
        };
    }

    // 2. Scale-Based Isolation (Dynamic)
    // If employee count is over 10,000, they likely have internal groups for everything DataVex offers.
    if (signals.employeeCount && signals.employeeCount >= 10000) {
        return {
            score: 0,
            reason: `DataVex Isolation: Mega-Enterprise Scale Detected (${signals.employeeCount.toLocaleString()} employees). Organizations of this scale maintain massive internal AI/DevOps divisions and custom governance frameworks.`,
        };
    }

    // 3. Capability-Based Isolation
    // If they already have dedicated "Internal AI Labs" or "Proprietary Cloud Infrastructure"
    if (signals.hasInternalAI && signals.hasInternalDevOps) {
        return {
            score: 0,
            reason: `DataVex Isolation: Deep Internal Capability Redundancy. Signals indicate existing high-maturity AI and DevOps units that handle core DataVex functions internally.`,
        };
    }

    return null;
}
