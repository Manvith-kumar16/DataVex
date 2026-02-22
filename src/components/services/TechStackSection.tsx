import { motion } from 'framer-motion';
import { Monitor, Server, Brain, CloudCog, Activity, ShieldCheck } from 'lucide-react';

const techStack = [
    {
        category: "Frontend",
        icon: Monitor,
        items: ["React", "Responsive design"]
    },
    {
        category: "Backend",
        icon: Server,
        items: ["Node.js", "FastAPI", "PostgreSQL"]
    },
    {
        category: "AI & Data Science",
        icon: Brain,
        items: ["Machine Learning", "NLP"]
    },
    {
        category: "Cloud Infrastructure",
        icon: CloudCog,
        items: ["AWS", "Docker", "Kubernetes"]
    },
    {
        category: "Monitoring",
        icon: Activity,
        items: ["Prometheus", "Grafana"]
    },
    {
        category: "Security",
        icon: ShieldCheck,
        items: ["Zero-trust architecture", "Encryption"]
    }
];

export function TechStackSection() {
    return (
        <section className="mb-20 px-4">
            <div className="flex flex-col items-center mb-12 text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight mb-4">Technology Stack</h2>
                <div className="h-1 w-20 bg-accent rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {techStack.map((tech, i) => (
                    <motion.div
                        key={tech.category}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-[2rem] bg-[#0a1118]/60 backdrop-blur-sm border border-accent/20 shadow-sm flex items-start gap-4 transition-all hover:border-accent/40"
                    >
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
                            <tech.icon className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-lg mb-2">{tech.category}</h3>
                            <div className="flex flex-wrap gap-2">
                                {tech.items.map(item => (
                                    <span key={item} className="px-3 py-1 bg-secondary/50 rounded-lg text-xs font-semibold text-muted-foreground border border-border/30">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
