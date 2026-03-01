import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, DollarSign } from "lucide-react";
import { api } from "@/lib/api";
import type { ServiceCatalogResponse } from "@/lib/types";

export default function ServicesSection() {
  const { data: services, isLoading } = useQuery({
    queryKey: ["public-services"],
    queryFn: () => api.get<ServiceCatalogResponse[]>("/api/public/services"),
  });

  return (
    <section id="servicios" className="py-24 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-2">Lo que hacemos</p>
          <h2 className="text-5xl md:text-7xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Nuestros Servicios
          </h2>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse h-48" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services?.filter(s => s.active).map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              >
                <h3
                  className="text-2xl mb-2 text-foreground group-hover:text-primary transition-colors"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                )}
                <div className="flex items-center gap-4 mt-auto">
                  <span className="flex items-center gap-1 text-primary font-bold text-lg">
                    <DollarSign size={16} />
                    {service.price.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock size={14} />
                    {service.durationMinutes} min
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
