import { motion } from 'framer-motion';
import { Target, CheckCircle2 } from 'lucide-react';

export function AboutSection() {
    const visionPoints = [
        "Data-driven innovation",
        "Practical product development",
        "Measurable business impact",
        "End-to-end expertise"
    ];

    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20 px-4">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
            >
                <h2 className="font-display text-3xl font-bold tracking-tight">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    DataVex is a visionary technology company specializing in AI, data science, cloud infrastructure, and digital transformation.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Our mission is to empower businesses to harness data and intelligent systems, turning complex information into strategic advantages.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative group"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent/50 rounded-[2rem] blur opacity-15 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
                <div className="relative bg-[#0a1118]/80 backdrop-blur-xl border border-accent/20 rounded-[2rem] p-10 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                            <Target className="h-6 w-6 text-accent" />
                        </div>
                        <h3 className="font-display text-2xl font-bold text-white">Vision & Approach</h3>
                    </div>

                    <ul className="space-y-4">
                        {visionPoints.map((point, i) => (
                            <motion.li
                                key={point}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 text-foreground/80 font-medium"
                            >
                                <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                                {point}
                            </motion.li>
                        ))}
                    </ul>
                </div>
            </motion.div>
        </section>
    );
}
