import { motion } from 'framer-motion';

export function HeroSection() {
    return (
        <section className="relative h-[400px] flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-[#0a1118] border border-accent/20 shadow-2xl mb-12 group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5 opacity-50" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />

            <div className="relative z-10 text-center px-6 max-w-4xl">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="font-display text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight"
                >
                    Driving Business Growth with <br />
                    <span className="text-accent">AI and Data Innovation</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto"
                >
                    Pioneering the intersection of AI, Cloud, and Digital Transformation
                </motion.p>
            </div>

            <div className="absolute -top-24 -left-24 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl opacity-20" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-green-400/30 rounded-full blur-3xl opacity-20" />
        </section>
    );
}
