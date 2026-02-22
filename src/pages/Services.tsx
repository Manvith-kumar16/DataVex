import { Sidebar, MobileHeader } from '@/components/layout/Sidebar';
import { HeroSection } from '@/components/services/HeroSection';
import { AboutSection } from '@/components/services/AboutSection';
import { CoreServicesSection } from '@/components/services/CoreServicesSection';
import { TechStackSection } from '@/components/services/TechStackSection';
import { motion } from 'framer-motion';

export default function Services() {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <MobileHeader />

            <main className="lg:pl-64 pt-16 lg:pt-0">
                <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-12">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <HeroSection />
                        <AboutSection />
                        <CoreServicesSection />
                        <TechStackSection />
                    </motion.div>

                    <footer className="pt-12 pb-6 border-t border-border/20 text-center">
                        <p className="text-sm text-muted-foreground">
                            © 2026 Datavex.AI. All rights reserved. Professional Intelligence Solutions.
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
