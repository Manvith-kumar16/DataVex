import { getEnterprisePenalty } from './scoring/enterpriseConstraint';

export interface EnterpriseIsolationResult {
    isEnterprise: boolean;
    category?: string;
    explanation?: string;
}

export type EnterpriseMode = 'hard-stop' | 'soft-warning';
export const ENTERPRISE_MODE: EnterpriseMode = 'hard-stop';

/**
 * Checks if a domain qualifies for Enterprise Isolation.
 * Uses the comprehensive getEnterprisePenalty utility as source of truth.
 */
export function checkEnterpriseIsolation(domain: string): EnterpriseIsolationResult {
    const penalty = getEnterprisePenalty(domain);

    if (penalty) {
        return {
            isEnterprise: true,
            category: 'Strategic Target Isolation',
            explanation: penalty.reason
        };
    }

    return { isEnterprise: false };
}
