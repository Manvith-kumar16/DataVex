export async function searchCompany(domain: string) {
    const apiKey = process.env.TAVILY_API_KEY || "tvly-placeholder";

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: `company ${domain} about us and news`,
                search_depth: "basic",
                include_answer: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        // Map actual results to match criteria
        const newsResults = (data.results || []).slice(0, 3).map((item: any) => ({
            title: item.title,
            url: item.url,
            snippet: item.content,
        }));

        return {
            homepageText: data.answer || `Homepage info for ${domain}`,
            aboutText: `Found information about ${domain}: ${data.answer}`,
            newsResults: newsResults,
        };
    } catch (error) {
        console.warn(`Search API failed for ${domain}, falling back to mock data:`, error);

        // Fallback block if the real fetch fails
        return {
            homepageText: `Mock homepage string for ${domain}. We provide cutting-edge solutions to industry challenges.`,
            aboutText: `Mock about text for ${domain}. The company has been revolutionizing the sector since its inception.`,
            newsResults: [
                {
                    title: `Exciting new product from ${domain} launched`,
                    url: `https://${domain}/news/launch-event`,
                    snippet: `The company has revealed a much-anticipated product line focusing on efficiency.`,
                },
                {
                    title: `${domain} leadership speaks at industry conference`,
                    url: `https://mock-news.com/article/${domain}-talk`,
                    snippet: `Executives shared key insights on the future of technology and adoption trends.`,
                }
            ]
        };
    }
}
