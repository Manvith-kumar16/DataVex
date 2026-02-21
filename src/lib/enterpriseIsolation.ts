/**
 * src/lib/enterpriseIsolation.ts
 * 
 * Strategic isolation layer for DataVex.
 * Detects large enterprise organizations with deep internal capabilities
 * to short-circuit processing before scoring agents run.
 */

export interface EnterpriseIsolationResult {
    isEnterprise: boolean;
    category?: string;
    explanation?: string;
}

/**
 * Configuration for enterprise isolation behavior.
 * 'hard-stop': Terminates the pipeline immediately (Default).
 * 'soft-warning': Processes normally but flags the enterprise status.
 */
export type EnterpriseMode = 'hard-stop' | 'soft-warning';

export const ENTERPRISE_MODE: EnterpriseMode = 'hard-stop';

/**
 * Categorized list of organizations with deep internal engineering/AI capabilities.
 * These are strategically unlikely to acquire external core infrastructure services.
 */
const ENTERPRISE_DATABASE: Record<string, { category: string; reasoning: string }> = {
    // Cloud & Infrastructure Giants
    'microsoft.com': { category: 'Cloud & Infrastructure Giant', reasoning: 'Deep internal DevOps, AI, and cloud infrastructure capabilities.' },
    'google.com': { category: 'Cloud & Infrastructure Giant', reasoning: 'Leading internal AI research and proprietary cloud stack.' },
    'amazon.com': { category: 'Cloud & Infrastructure Giant', reasoning: 'Massive internal AWS engineering teams.' },
    'oracle.com': { category: 'Cloud & Infrastructure Giant', reasoning: 'Internal specialized database and cloud engineering.' },
    'salesforce.com': { category: 'Cloud & Infrastructure Giant', reasoning: 'Extensive internal SaaS and AI (Einstein) infrastructure.' },
    'sap.com': { category: 'Cloud & Infrastructure Giant', reasoning: 'Large-scale internal enterprise software engineering.' },
    'alibaba.com': { category: 'Global Tech Giant', reasoning: 'Massive internal engineering & cloud capabilities.' },
    'alibabacloud.com': { category: 'Global Cloud Provider', reasoning: 'International-scale infrastructure & DevOps teams.' },
    'tencent.com': { category: 'Global Tech Giant', reasoning: 'World-class AI labs and internal engineering.' },
    'baidu.com': { category: 'AI & Search Giant', reasoning: 'Deep focus on internal AI research and proprietary infrastructure.' },
    'huawei.com': { category: 'Telecom & Infrastructure Giant', reasoning: 'Highly specialized internal software & hardware AI teams.' },

    // Big Tech Platforms
    'meta.com': { category: 'Big Tech Platform', reasoning: 'Massive internal engineering teams building core infrastructure (PyTorch, React).' },
    'apple.com': { category: 'Big Tech Platform', reasoning: 'Vertically integrated hardware and software engineering labs.' },
    'adobe.com': { category: 'Big Tech Platform', reasoning: 'Leading internal creative and marketing cloud engineering.' },
    'uber.com': { category: 'Big Tech Platform', reasoning: 'Advanced internal logistics and data platforms.' },
    'airbnb.com': { category: 'Big Tech Platform', reasoning: 'Highly sophisticated internal product engineering.' },
    'openai.com': { category: 'AI Research Leader', reasoning: 'Premier internal AI infrastructure and modeling teams.' },
    'anthropic.com': { category: 'AI Research Leader', reasoning: 'Specialized internal AI safety and infrastructure teams.' },
    'deepmind.com': { category: 'AI Research Leader', reasoning: 'Elite internal AI research and engineering groups.' },

    // Financial & Consulting Giants
    'visa.com': { category: 'Financial Tech Giant', reasoning: 'Extreme internal scale and security engineering requirements.' },
    'mastercard.com': { category: 'Financial Tech Giant', reasoning: 'Extensive internal payment processing and tech units.' },
    'accenture.com': { category: 'Global IT Consulting Giant', reasoning: 'Massive internal digital transformation and engineering services.' },
    'infosys.com': { category: 'Global IT Services Giant', reasoning: 'Deep pool of internal technical and cloud engineering talent.' },
    'tcs.com': { category: 'Global IT Services Giant', reasoning: 'Global-scale internal engineering and AI capabilities.' },

    // Hardware & Semi-conductors
    'nvidia.com': { category: 'AI Hardware Leader', reasoning: 'Advanced internal AI research and system engineering.' },
    'intel.com': { category: 'Semiconductor Leader', reasoning: 'Internal fabrication and complex silicon engineering.' },
    'amd.com': { category: 'Semiconductor Leader', reasoning: 'Highly specialized internal chip and software teams.' },

    // Large Retailers (with internal tech units)
    'walmart.com': { category: 'Large-Scale Retailer', reasoning: 'Walmart Global Tech builds and manages its own infrastructure.' },
};

/**
 * Checks if a domain qualifies for Enterprise Isolation.
 * 
 * @param domain - The company domain to check.
 * @returns An EnterpriseIsolationResult indicating if isolation is recommended.
 */
export function checkEnterpriseIsolation(domain: string): EnterpriseIsolationResult {
    const normalized = domain.toLowerCase().trim();

    // Direct Match
    if (ENTERPRISE_DATABASE[normalized]) {
        return {
            isEnterprise: true,
            category: ENTERPRISE_DATABASE[normalized].category,
            explanation: ENTERPRISE_DATABASE[normalized].reasoning
        };
    }

    // Subdomain Match
    for (const [parent, data] of Object.entries(ENTERPRISE_DATABASE)) {
        if (normalized.endsWith(`.${parent}`)) {
            return {
                isEnterprise: true,
                category: data.category,
                explanation: `Sub-division of ${parent}: ${data.reasoning}`
            };
        }
    }

    return { isEnterprise: false };
}
