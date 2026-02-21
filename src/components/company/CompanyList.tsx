import { useState, useEffect, useRef } from 'react';
import { Building2, SearchX, Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { CompanyCard, OSMCompany } from './CompanyCard';
import type { Location } from '@/components/location/LocationSearch';
import { Button } from '@/components/ui/button';

interface CompanyListProps {
    location: Location | null;
}

export function CompanyList({ location }: CompanyListProps) {
    const [companies, setCompanies] = useState<OSMCompany[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const prevLocationRef = useRef<Location | null>(null);

    useEffect(() => {
        // Reset state when location changes entirely
        if (location && prevLocationRef.current?.display_name !== location.display_name) {
            setCompanies([]);
            setPage(1);
            setHasMore(true);
            setError(null);
        }
        prevLocationRef.current = location;
    }, [location]);

    useEffect(() => {
        if (!location) return;

        let isMounted = true;
        const fetchCompanies = async () => {
            setLoading(true);
            setError(null);

            const radius = page * 5000;

            try {
                // Extended query as requested to find more companies
                const query = `
          [out:json];
          (
            node["office"](around:${radius}, ${location.lat}, ${location.lon});
            node["company"](around:${radius}, ${location.lat}, ${location.lon});
            node["industrial"](around:${radius}, ${location.lat}, ${location.lon});
            node["business"](around:${radius}, ${location.lat}, ${location.lon});
          );
          out 50;
        `;

                const response = await fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `data=${encodeURIComponent(query)}`
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch from Overpass API');
                }

                const data = await response.json();

                if (isMounted) {
                    const results: OSMCompany[] = (data.elements || [])
                        .filter((node: any) => node.tags && node.tags.name)
                        .map((node: any) => ({
                            id: node.id,
                            name: node.tags.name,
                            type: node.tags.office || node.tags.company || node.tags.industrial || node.tags.business || 'business',
                            lat: node.lat,
                            lon: node.lon
                        }));

                    setCompanies(prev => {
                        // Merge old and new, and deduplicate by name
                        const combined = [...prev, ...results];
                        const uniqueMap = new Map();
                        combined.forEach(item => uniqueMap.set(item.name.toLowerCase(), item));

                        const uniqueCompanies = Array.from(uniqueMap.values());

                        // If the deduplicated length didn't increase from the previous, there's no more to fetch at this radius
                        if (uniqueCompanies.length === prev.length && results.length > 0) {
                            // We fetched stuff but they were all duplicates of what we already have
                        }

                        // Let's rely on hasMore = false if the fetch brings literally 0 new valid elements over what we had.
                        // Wait, Overpass `out 50;` might limit results. If results < 50, maybe no more at this radius?
                        // Let's just track if the overall unique list grew.
                        if (uniqueCompanies.length <= prev.length && prev.length > 0) {
                            setHasMore(false);
                        } else {
                            setHasMore(true);
                        }

                        return uniqueCompanies;
                    });
                }
            } catch (e: any) {
                if (isMounted) {
                    setError(e.message || 'An error occurred fetching companies.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchCompanies();
        return () => { isMounted = false; };
    }, [location, page]);

    if (!location) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-accent" />
                    Detected Regional Companies
                </h2>
                {companies.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                        {companies.length} Found ({page * 5}km radius)
                    </span>
                )}
            </div>

            {/* Error State */}
            {!loading && error && companies.length === 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center text-destructive">
                    <p>{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && companies.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center text-muted-foreground"
                >
                    <SearchX className="h-10 w-10 mb-4 opacity-50" />
                    <p className="font-medium text-foreground">No companies found in this area</p>
                    <p className="text-sm mt-1">Try expanding your search or trying a denser commercial zone.</p>
                </motion.div>
            )}

            {/* Company Grid List */}
            {companies.length > 0 && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {companies.map((company) => (
                        <motion.div
                            key={company.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            layout
                        >
                            <CompanyCard company={company} />
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Loading Skeletons */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-5 h-40 w-full flex flex-col justify-between">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="h-10 w-10 bg-secondary rounded-lg"></div>
                                <div className="space-y-2 flex-1 pt-1">
                                    <div className="h-4 bg-secondary rounded w-2/3"></div>
                                    <div className="h-3 bg-secondary rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="h-9 w-full bg-secondary rounded-md mt-4"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Load More Button */}
            {companies.length > 0 && hasMore && !loading && !error && (
                <div className="flex justify-center mt-8 pt-4">
                    <Button
                        onClick={() => setPage(p => p + 1)}
                        variant="outline"
                        className="gap-2 bg-secondary hover:bg-secondary/80 border-border"
                    >
                        <Plus className="h-4 w-4" />
                        Load More Companies
                    </Button>
                </div>
            )}

            {/* End of results */}
            {companies.length > 0 && !hasMore && !loading && (
                <div className="text-center text-sm text-muted-foreground mt-8 pt-4">
                    No more companies found within {page * 5}km.
                </div>
            )}
        </div>
    );
}
