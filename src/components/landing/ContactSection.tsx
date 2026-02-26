import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Instagram } from "lucide-react";

export default function ContactSection() {
  return (
    <section id="contacto" className="py-24 px-4 bg-card/50">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-2">Encontranos</p>
          <h2 className="text-5xl md:text-7xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Contacto
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="text-primary" size={20} />
              </div>
              <div>
                <p className="font-medium text-foreground">Dirección</p>
                <p className="text-muted-foreground text-sm">Av. Corrientes 1234, CABA</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="text-primary" size={20} />
              </div>
              <div>
                <p className="font-medium text-foreground">Teléfono</p>
                <p className="text-muted-foreground text-sm">+54 11 1234-5678</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="text-primary" size={20} />
              </div>
              <div>
                <p className="font-medium text-foreground">Horarios</p>
                <p className="text-muted-foreground text-sm">Lun a Sáb: 9:00 - 20:00</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Instagram className="text-primary" size={20} />
              </div>
              <div>
                <p className="font-medium text-foreground">Instagram</p>
                <a href="#" className="text-primary text-sm hover:underline">@barbershop</a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-xl overflow-hidden h-64 md:h-auto flex items-center justify-center"
          >
            <div className="text-center text-muted-foreground">
              <MapPin size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Mapa de ubicación</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto mt-24 pt-8 border-t border-border text-center">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Barber Shop. Todos los derechos reservados.
        </p>
      </div>
    </section>
  );
}
