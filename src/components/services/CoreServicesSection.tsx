import { motion } from 'framer-motion';
import { Code2, BrainCircuit, Cloud, Zap } from 'lucide-react';

const services = [
    {
        title: "Application Development",
        description: "Full-stack enterprise and cloud-native development",
        icon: Code2,
        color: "text-accent",
        bg: "bg-accent/10"
    },
    {
        title: "AI & Data Analytics",
        description: "Custom AI solutions, predictive analytics",
        icon: BrainCircuit,
        color: "text-accent",
        bg: "bg-accent/10"
    },
    {
        title: "Cloud & DevOps",
        description: "AWS, Azure, CI/CD, scalability",
        icon: Cloud,
        color: "text-accent",
        bg: "bg-accent/10"
    },
    {
        title: "Digital Transformation",
        description: "Automation, consulting, business optimization",
        icon: Zap,
        color: "text-accent",
        bg: "bg-accent/10"
    }
];

export function CoreServicesSection() {
    return (
        <section className="mb-20 px-4">
            <div className="flex flex-col items-center mb-12 text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight mb-4">Core Services</h2>
                <div className="h-1 w-20 bg-accent rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {services.map((service, i) => (
                    <motion.div
                        key={service.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="group p-8 rounded-3xl bg-[#0a1118]/80 backdrop-blur-xl border border-border/50 hover:border-accent/40 shadow-lg hover:shadow-accent/10 transition-all duration-300"
                    >
                        <div className={`h-14 w-14 rounded-2xl ${service.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <service.icon className={`h-7 w-7 ${service.color}`} />
                        </div>
                        <h3 className="font-display text-xl font-bold mb-3">{service.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {service.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
