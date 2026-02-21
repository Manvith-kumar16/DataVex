import { Signal, Evidence } from "../utils";

export function detectFunding(newsResults: any[]): Signal | null {
    const keywords = ["funding", "raised", "series", "investment"];
    const evidenceList: Evidence[] = [];

    for (const article of newsResults || []) {
        if (!article || !article.snippet) continue;

        const snippetLower = article.snippet.toLowerCase();
        const hasKeyword = keywords.some(keyword => snippetLower.includes(keyword));

        if (hasKeyword) {
            evidenceList.push({
                claim: "Recent funding activity detected",
                sourceUrl: article.url,
                snippet: article.snippet,
                reliability: 0.7,
                type: "VERIFIED"
            });
        }
    }

    if (evidenceList.length === 0) {
        return null;
    }

    return {
        category: "FUNDING",
        value: "Recent funding detected",
        evidence: evidenceList
    };
}
