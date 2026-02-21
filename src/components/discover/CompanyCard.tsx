import { motion } from 'framer-motion';
import { Building2, MapPin, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export interface Company {
    id: number;
    name: string;
    lat: number;
    lon: number;
    tags: {
        [key: string]: string;
    };
}

interface CompanyCardProps {
    company: Company;
    index: number;
}

export function CompanyCard({ company, index }: CompanyCardProps) {
    const navigate = useNavigate();
    const name = company.tags.name || 'Unknown Company';
    const office = company.tags.office || company.tags.company || company.tags.industrial || 'Office';

    const handleAnalyze = () => {
        // Basic domain extraction or just use name for query
        const domain = name.toLowerCase().replace(/\s+/g, '') + '.com';
        navigate(`/analysis?domain=${encodeURIComponent(domain)}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="group bg-card border border-border rounded-xl p-5 hover:border-accent/40 transition-all hover:shadow-lg border-glow overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <ExternalLink className="h-4 w-4" />
                </div>
            </div>

            <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                    <Building2 className="h-6 w-6 text-accent" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-display font-bold text-lg text-foreground truncate group-hover:text-accent transition-colors">
                        {name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                        <span className="capitalize">{office}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">Nearby ({company.lat.toFixed(4)}, {company.lon.toFixed(4)})</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs border-border/50 hover:bg-secondary"
                    disabled
                >
                    View Map
                </Button>
                <Button
                    variant="neon"
                    size="sm"
                    onClick={handleAnalyze}
                    className="flex-1 h-9 text-xs gap-2"
                >
                    Analyze
                    <ArrowRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </motion.div>
    );
}
