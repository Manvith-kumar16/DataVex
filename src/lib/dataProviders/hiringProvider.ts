import { Signal, Evidence } from "../utils";

export function detectHiring(homepageText: string, aboutText: string): Signal {
    const combinedText = homepageText + " " + aboutText;
    const combinedTextLower = combinedText.toLowerCase();

    const keywords = [
        "hiring",
        "careers",
        "join our team",
        "we are hiring"
    ];

    let count = 0;
    let matchedSnippet = "";

    for (const keyword of keywords) {
        // Simple count of occurrences
        let pos = combinedTextLower.indexOf(keyword);
        while (pos !== -1) {
            count++;

            // Keep the first reasonably sized snippet we find
            if (!matchedSnippet) {
                const start = Math.max(0, pos - 40);
                const end = Math.min(combinedText.length, pos + keyword.length + 40);
                matchedSnippet = combinedText.substring(start, end).trim() + "...";
            }

            pos = combinedTextLower.indexOf(keyword, pos + keyword.length);
        }
    }

    const velocity = count > 3 ? "HIGH" : "LOW";

    const evidence: Evidence = {
        claim: "Hiring velocity detected",
        sourceUrl: "company website",
        snippet: matchedSnippet || "No explicit keyword snippet found, but text analyzed.",
        reliability: 0.5,
        type: "INFERRED"
    };

    return {
        category: "HIRING",
        value: `Hiring velocity ${velocity}`,
        evidence: [evidence]
    };
}
