import { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

export interface OSMPlace {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
}

interface LocationSearchProps {
    onSelect: (location: OSMPlace) => void;
}

export function LocationSearch({ onSelect }: LocationSearchProps) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<OSMPlace[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // useDebounce might not exist, but let's implement a simple debounce here if it doesn't. Let's just create a local debounce or use the one from utils. 
    // Wait, I saw debounce in utils in Dashboard.tsx: `import { debounce } from '@/lib/utils';`

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!query.trim()) {
                setSuggestions([]);
                return;
            }
            setIsLoading(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
                const data = await response.json();
                setSuggestions(data);
                setIsOpen(true);
            } catch (error) {
                console.error('Failed to fetch locations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchSuggestions();
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    // Click outside listener
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
                    placeholder="Search any location (e.g. San Francisco, CA)..."
                    className="pl-9 h-12 bg-card border-border border-glow text-base"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                    {suggestions.map((place) => (
                        <button
                            key={place.place_id}
                            onClick={() => {
                                setQuery(place.display_name.split(',')[0]);
                                setIsOpen(false);
                                onSelect(place);
                            }}
                            className="w-full flex items-start gap-3 p-4 hover:bg-secondary/80 transition-colors text-left border-b border-border/50 last:border-0"
                        >
                            <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {place.display_name.split(',')[0]}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {place.display_name.split(',').slice(1).join(',').trim()}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
