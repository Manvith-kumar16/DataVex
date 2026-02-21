import { Signal, Evidence, memoize } from "../utils";

const rawDetectTechStack = (text: string): Signal | null => {
    const keywords = [
        "react",
        "next.js",
        "aws",
        "azure",
        "gcp",
        "docker",
        "kubernetes",
        "firebase",
        "node",
        "python"
    ];

    const textLower = text.toLowerCase();
    const detectedTech: string[] = [];
    const evidenceList: Evidence[] = [];

    for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
            detectedTech.push(keyword);

            evidenceList.push({
                claim: "Technology stack inferred from website text",
                sourceUrl: "company website",
                snippet: keyword,
                reliability: 0.5,
                type: "INFERRED"
            });
        }
    }

    if (detectedTech.length === 0) {
        return null;
    }

    return {
        category: "TECH_STACK",
        value: detectedTech.join(", "),
        evidence: evidenceList
    };
}

export const detectTechStack = memoize(rawDetectTechStack);
