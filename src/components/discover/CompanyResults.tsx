import { useState, useEffect, useCallback } from 'react';
import { Company, CompanyCard } from './CompanyCard';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Map as MapIcon, ChevronRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompanyResultsProps {
    location: {
        lat: string;
        lon: string;
        display_name: string;
    } | null;
}

interface OverpassElement {
    id: number;
    tags: {
        name?: string;
        [key: string]: string | undefined;
    };
}

export function CompanyResults({ location }: CompanyResultsProps) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [radius, setRadius] = useState(5000);
    const [error, setError] = useState<string | null>(null);

    const fetchCompanies = useCallback(async (isLoadMore = false) => {
        if (!location) return;

        setIsLoading(true);
        setError(null);

        const lat = location.lat;
        const lon = location.lon;
        const currentRadius = isLoadMore ? (page + 1) * 5000 : 5000;

        const query = `
      [out:json];
      (
        node["office"](around:${currentRadius},${lat},${lon});
        node["company"](around:${currentRadius},${lat},${lon});
        node["industrial"](around:${currentRadius},${lat},${lon});
      );
      out;
    `;

        try {
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query,
            });

            if (!response.ok) throw new Error('Failed to fetch from Overpass API');

            const data = await response.json();
            const newCompanies = (data.elements || []).filter((el: OverpassElement) => el.tags && el.tags.name);

            if (isLoadMore) {
                setCompanies(prev => {
                    const combined = [...prev, ...newCompanies];
                    // Remove duplicates based on ID
                    return Array.from(new Map(combined.map(c => [c.id, c])).values());
                });
                setPage(prev => prev + 1);
                setRadius(currentRadius);
            } else {
                setCompanies(newCompanies);
                setPage(1);
                setRadius(5000);
            }
        } catch (err) {
            console.error('Overpass Error:', err);
            setError('Unable to load companies in this area. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [location, page]);

    useEffect(() => {
        if (location) {
            fetchCompanies(false);
        } else {
            setCompanies([]);
        }
    }, [location]);

    if (!location) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                    <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Start Discovery</h3>
                <p className="text-muted-foreground max-w-sm">
                    Enter a location above to find registered offices, companies, and industrial nodes in the area.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h2 className="text-xl font-display font-bold flex items-center gap-2">
                        <Layers className="h-5 w-5 text-accent" />
                        Organizations near {location.display_name.split(',')[0]}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Found {companies.length} entities within {radius / 1000}km radius
                    </p>
                </div>

                {companies.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-secondary px-2 py-1 rounded">
                            OSM Data Source
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {companies.map((company, index) => (
                        <CompanyCard key={company.id} company={company} index={index % 12} />
                    ))}
                </AnimatePresence>
            </div>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 text-accent animate-spin" />
                        <p className="text-sm text-muted-foreground animate-pulse">Scanning location nodes...</p>
                    </div>
                </div>
            )}

            {!isLoading && companies.length > 0 && (
                <div className="flex justify-center pt-4 pb-12">
                    <Button
                        variant="outline"
                        onClick={() => fetchCompanies(true)}
                        className="h-12 px-8 rounded-xl border-border hover:bg-secondary group transition-all"
                    >
                        <span>Load More (Expand Search Radius)</span>
                        <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}

            {!isLoading && companies.length === 0 && !error && (
                <div className="text-center py-20 px-4">
                    <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">No companies found in this immediate area.</p>
                    <Button
                        variant="link"
                        onClick={() => fetchCompanies(true)}
                        className="text-accent mt-2"
                    >
                        Try expanding the search radius
                    </Button>
                </div>
            )}
        </div>
    );
}
