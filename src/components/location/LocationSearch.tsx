import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

export interface Location {
    display_name: string;
    lat: string;
    lon: string;
}

interface LocationSearchProps {
    onLocationSelect: (location: Location) => void;
}

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(query, 500);

    useEffect(() => {
        const fetchLocations = async () => {
            if (!debouncedQuery) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=5`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setResults(data);
                    setIsOpen(true);
                } else {
                    setResults([]);
                    setIsOpen(false);
                }
            } catch (error) {
                console.error("Failed to fetch locations", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, [debouncedQuery]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (loc: Location) => {
        setQuery(loc.display_name);
        setIsOpen(false);
        onLocationSelect(loc);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative flex items-center">
                <MapPin className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search any city or region..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    className="pl-9 h-12 bg-secondary border-border focus:border-accent transition-colors w-full"
                />
                {loading && (
                    <Loader2 className="absolute right-3 h-4 w-4 text-muted-foreground animate-spin" />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <ul className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map((loc, i) => (
                        <li
                            key={i}
                            onClick={() => handleSelect(loc)}
                            className="px-4 py-3 hover:bg-secondary cursor-pointer border-b border-border/50 last:border-0 flex items-start gap-3 transition-colors text-sm"
                        >
                            <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                            <span className="text-foreground leading-snug">{loc.display_name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
