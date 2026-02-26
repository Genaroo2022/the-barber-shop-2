import { motion } from "framer-motion";

export default function HeroSection() {
  const scrollToBooking = () => {
    document.querySelector("#reservar")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, hsl(82 85% 50% / 0.1) 50px, hsl(82 85% 50% / 0.1) 51px),
            repeating-linear-gradient(90deg, transparent, transparent 50px, hsl(82 85% 50% / 0.1) 50px, hsl(82 85% 50% / 0.1) 51px)`
        }} />
        {/* Geometric accent shapes */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rotate-45 rounded-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 border border-primary/10 rotate-12 rounded-2xl" />
        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-primary/30 rounded-full" />
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-primary/20 rounded-full" />
      </div>

      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-primary text-sm md:text-base tracking-[0.3em] uppercase mb-4 font-medium">
            Estilo • Precisión • Actitud
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-7xl md:text-9xl lg:text-[10rem] leading-[0.85] mb-6"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          <span className="text-foreground">BARBER</span>
          <br />
          <span className="text-primary">SHOP</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto mb-10"
        >
          Tu barbería de confianza. Cortes modernos, clásicos y con onda.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <button
            onClick={scrollToBooking}
            className="bg-primary text-primary-foreground px-10 py-4 text-lg font-bold uppercase tracking-wider hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem" }}
          >
            Reservá tu turno
          </button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-5 h-8 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 bg-primary rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
