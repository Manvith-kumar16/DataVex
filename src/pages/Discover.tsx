import { useState } from 'react';
import { Sidebar, MobileHeader } from '@/components/layout/Sidebar';
import { LocationSearch, OSMPlace } from '@/components/discover/LocationSearch';
import { CompanyResults } from '@/components/discover/CompanyResults';
import { motion } from 'framer-motion';
import { Compass, Info } from 'lucide-react';

export default function Discover() {
    const [selectedLocation, setSelectedLocation] = useState<OSMPlace | null>(null);

    const handleLocationSelect = (place: OSMPlace) => {
        setSelectedLocation(place);
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <MobileHeader />

            <main className="lg:pl-60 pt-14 lg:pt-0">
                <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-10">
                    {/* Hero / Search Section */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3"
                        >
                            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <Compass className="h-6 w-6 text-accent" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="font-display text-3xl font-bold tracking-tight">Location Discovery</h1>
                                <p className="text-sm text-muted-foreground">Find and analyze organizations based on geographic location.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-2xl p-8 border-glow relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Compass className="h-40 w-40 text-accent -rotate-12" />
                            </div>

                            <div className="relative z-10 max-w-2xl">
                                <h2 className="text-lg font-medium mb-4">Where do you want to explore?</h2>
                                <LocationSearch onSelect={handleLocationSelect} />

                                <div className="flex items-center gap-2 mt-4 text-[11px] text-muted-foreground">
                                    <Info className="h-3.5 w-3.5" />
                                    <p>Using OpenStreetMap Nominatim for geocoding and Overpass API for entity discovery.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Results Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="min-h-[400px]"
                    >
                        <CompanyResults location={selectedLocation} />
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
