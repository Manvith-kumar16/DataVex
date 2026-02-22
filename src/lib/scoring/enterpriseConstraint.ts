/**
 * src/lib/scoring/enterpriseConstraint.ts
 *
 * Utility to identify and penalize large enterprise companies that are not likely
 * targets for DataVex AI (as they have deep internal capabilities).
 *
 * Strict Policy: All identified enterprises receive a 0 score and are flagged
 * for target isolation.
 */

export interface EnterprisePenalty {
    score: number;
    reason: string;
}

/**
 * Map of enterprise domains to their respective category/reasoning details.
 */
const LARGE_ENTERPRISES: Record<string, string> = {
    // Cloud & Infrastructure Giants
    'microsoft.com': 'Cloud & Infrastructure Giant (Deep Internal DevOps/AI Capabilities)',
    'google.com': 'Cloud & Infrastructure Giant (Deep Internal DevOps/AI Capabilities)',
    'amazon.com': 'Cloud & Infrastructure Giant (Deep Internal DevOps/AI Capabilities)',
    'aws.amazon.com': 'Cloud & Infrastructure Giant (Deep Internal DevOps/AI Capabilities)',
    'ibm.com': 'Cloud & Infrastructure Giant (Deep Internal DevOps/AI Capabilities)',
    'oracle.com': 'Cloud & Infrastructure Giant (Deep Internal DevOps/AI Capabilities)',
    'salesforce.com': 'Cloud & Infrastructure Giant (Deep Internal DevOps/AI Capabilities)',
    'sap.com': 'Cloud & Infrastructure Giant (Deep Internal DevOps/AI Capabilities)',
    'alibaba.com': 'Global Tech Giant (Massive Internal Engineering & Cloud Capabilities)',
    'alibabacloud.com': 'Global Cloud Provider (Internal DevOps/AI Infrastructure)',
    'tencent.com': 'Global Tech Giant (Massive Internal Engineering & AI Labs)',
    'baidu.com': 'AI & Search Giant (Internal Research & Cloud Teams)',
    'huawei.com': 'Telecom & Infrastructure Giant (In-House Software & AI)',

    // Big Tech Platforms
    'meta.com': 'Big Tech Platform (Massive Internal Engineering Teams)',
    'facebook.com': 'Big Tech Platform (Massive Internal Engineering Teams)',
    'apple.com': 'Big Tech Platform (Massive Internal Engineering Teams)',
    'netflix.com': 'Big Tech Platform (Massive Internal Engineering Teams)',
    'adobe.com': 'Big Tech Platform (Massive Internal Engineering Teams)',
    'uber.com': 'Big Tech Platform (Massive Internal Engineering Teams)',
    'airbnb.com': 'Big Tech Platform (Massive Internal Engineering Teams)',
    'openai.com': 'AI Research & Infrastructure Leader (Internal AI Teams)',
    'anthropic.com': 'AI Research & Infrastructure Leader (Internal AI Teams)',
    'deepmind.com': 'AI Research & Infrastructure Leader (Internal AI Teams)',

    // Enterprise Software Leaders
    'vmware.com': 'Enterprise Software Leader (Internal Tooling Specialists)',
    'redhat.com': 'Enterprise Software Leader (Internal Tooling Specialists)',
    'servicenow.com': 'Enterprise Software Leader (Internal Tooling Specialists)',
    'splunk.com': 'Enterprise Software Leader (Internal Tooling Specialists)',
    'atlassian.com': 'Enterprise Software Leader (Internal Tooling Specialists)',
    'workday.com': 'Enterprise Software Leader (Internal Tooling Specialists)',
    'intuit.com': 'Enterprise SaaS Leader (Strong Internal Product Engineering)',
    'snowflake.com': 'Data Platform Giant (Internal Cloud & AI Engineering)',
    'databricks.com': 'Data & AI Platform Leader (Internal AI Research Teams)',
    'mongodb.com': 'Database Platform Leader (Internal Engineering Teams)',
    'elastic.co': 'Search & Analytics Platform Leader',
    'cloudflare.com': 'Global Infrastructure & Security Platform',
    'akamai.com': 'Content Delivery & Cloud Infrastructure Giant',
    'palantir.com': 'Enterprise Data Platform (Internal AI Engineering)',
    'slack.com': 'Enterprise Collaboration Platform (Internal Dev Teams)',
    'notion.so': 'Large SaaS Platform (Strong Internal Engineering)',
    'monday.com': 'Enterprise SaaS Platform (Internal Product Teams)',
    'asana.com': 'Enterprise SaaS Platform (Internal Product Teams)',
    'figma.com': 'Design Platform Leader (Internal Engineering)',
    'canva.com': 'Design Platform Leader (Internal Engineering)',
    'gitlab.com': 'DevOps Platform Leader (Internal Engineering)',
    'github.com': 'Developer Platform Leader (Internal Engineering)',

    // Global IT Consulting & Services Giants
    'accenture.com': 'Global IT Consulting Giant (Internal Engineering & AI)',
    'infosys.com': 'Global IT Services Provider (Internal DevOps & Cloud Teams)',
    'tcs.com': 'Global IT Services Provider (Internal Engineering & AI)',
    'wipro.com': 'Global IT Services Provider (Internal Engineering & AI)',
    'capgemini.com': 'Global IT Consulting & Engineering Giant',
    'cognizant.com': 'Global IT Consulting & Engineering Giant',
    'hcltech.com': 'Global IT Services & Engineering Leader',
    'deloitte.com': 'Enterprise Consulting & Technology Giant',
    'pwc.com': 'Enterprise Consulting & Technology Giant',
    'ey.com': 'Enterprise Consulting & Technology Giant',
    'kpmg.com': 'Enterprise Consulting & Technology Giant',

    // Semiconductor & Hardware Leaders
    'intel.com': 'Semiconductor Leader (In-House Engineering & AI)',
    'amd.com': 'Semiconductor Leader (In-House Engineering & AI)',
    'nvidia.com': 'AI Hardware & Platform Leader (Internal AI Research)',
    'arm.com': 'Semiconductor Architecture Leader (Internal R&D)',
    'micron.com': 'Semiconductor & Storage Leader',
    'cisco.com': 'Telecom/Hardware Leader (Large Internal Software Teams)',
    'qualcomm.com': 'Telecom/Hardware Leader (Large Internal Software Teams)',
    'samsung.com': 'Telecom/Hardware Leader (Large Internal Software Teams)',
    'broadcom.com': 'Telecom/Hardware Leader (Large Internal Software Teams)',
    'hp.com': 'Enterprise Hardware & IT Leader',
    'dell.com': 'Enterprise Infrastructure & Hardware Leader',
    'lenovo.com': 'Global Hardware & Infrastructure Leader',

    // FinTech & Banking Giants
    'visa.com': 'Financial Tech Giant (Strong In-House Engineering)',
    'mastercard.com': 'Financial Tech Giant (Strong In-House Engineering)',
    'paypal.com': 'Financial Tech Giant (Strong In-House Engineering)',
    'block.xyz': 'Financial Tech Giant (Strong In-House Engineering)',
    'square.com': 'Financial Tech Giant (Strong In-House Engineering)',
    'capitalone.com': 'Financial Tech Giant (Strong In-House Engineering)',
    'goldmansachs.com': 'Financial Tech Giant (Strong In-House Engineering)',
    'jpmorganchase.com': 'Global Banking Giant (Internal Engineering Division)',
    'bankofamerica.com': 'Global Banking Giant (Internal Engineering Division)',
    'citibank.com': 'Global Banking Giant (Internal Engineering Division)',
    'hsbc.com': 'Global Banking Giant (Internal Engineering Division)',
    'morganstanley.com': 'Global Banking Giant (Internal Engineering Division)',

    // Large Retailers with In-House Tech
    'walmart.com': 'Large Retailer with In-House Tech (Builds Own Infrastructure)',
    'target.com': 'Large Retailer with In-House Tech (Builds Own Infrastructure)',
    'homedepot.com': 'Large Retailer with In-House Tech (Builds Own Infrastructure)',
    'costco.com': 'Large Retailer with In-House Tech (Builds Own Infrastructure)',
    'bestbuy.com': 'Large Retailer with In-House Tech (Builds Own Infrastructure)',

    // Mid-Large with Heavy Internal Tech Investment
    'dropbox.com': 'Heavy Internal Tech Investment (Internal Cloud/Analytics)',
    'spotify.com': 'Heavy Internal Tech Investment (Internal Cloud/Analytics)',
    'snap.com': 'Heavy Internal Tech Investment (Internal Cloud/Analytics)',
    'snapchat.com': 'Heavy Internal Tech Investment (Internal Cloud/Analytics)',
    'tiktok.com': 'Heavy Internal Tech Investment (Internal Cloud/Analytics)',
    'bytedance.com': 'Heavy Internal Tech Investment (Internal Cloud/Analytics)',
    'pinterest.com': 'Heavy Internal Tech Investment (Internal Cloud/Analytics)',
    'shopify.com': 'Heavy Internal Tech Investment (Internal Cloud/Analytics)',
    'zoom.us': 'Enterprise Software with Large Internal Ops',
    'squarespace.com': 'Enterprise Software with Large Internal Ops',
    'okta.com': 'Enterprise Software with Large Internal Ops',
    'zoominfo.com': 'Enterprise Software with Large Internal Ops',
    'hubspot.com': 'Enterprise Software with Large Internal Ops',
    'zendesk.com': 'Enterprise Software with Large Internal Ops',
    'twilio.com': 'Enterprise Software with Large Internal Ops',
    'docusign.com': 'Enterprise Software with Large Internal Ops',
    'stripe.com': 'Advanced In-House Tech Units (Strategic Self-Sufficiency)',
    'robinhood.com': 'Advanced In-House Tech Units (Strategic Self-Sufficiency)',
    'chime.com': 'Advanced In-House Tech Units (Strategic Self-Sufficiency)',
    'sofi.com': 'Advanced In-House Tech Units (Strategic Self-Sufficiency)',
};

/**
 * Checks if a domain is a large enterprise and returns a 0 score penalty.
 */
export function getEnterprisePenalty(domain: string): EnterprisePenalty | null {
    const normalizedDomain = domain.toLowerCase().trim();

    if (LARGE_ENTERPRISES[normalizedDomain]) {
        return {
            score: 0,
            reason: `DataVex Target Isolation: ${LARGE_ENTERPRISES[normalizedDomain]} — This organization maintains massive internal AI/DevOps teams and custom enterprise toolchains. They do not require any DataVex services at this time.`,
        };
    }

    for (const [enterpriseDomain, reason] of Object.entries(LARGE_ENTERPRISES)) {
        if (normalizedDomain.endsWith(`.${enterpriseDomain}`)) {
            return {
                score: 0,
                reason: `DataVex Target Isolation: ${reason} (Sub-division) — This organization maintains massive internal AI/DevOps teams and custom enterprise toolchains. They do not require any DataVex services at this time.`,
            };
        }
    }

    return null;
}
