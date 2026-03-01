import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Inicio", id: "hero" },
  { label: "Servicios", id: "servicios" },
  { label: "Galería", id: "galeria" },
  { label: "Reservar", id: "reservar" },
  { label: "Contacto", id: "contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const getNavbarOffset = () => {
    const navbarBar = document.querySelector("[data-navbar-bar]");
    return (navbarBar?.getBoundingClientRect().height ?? 64) + 2;
  };

  const scrollTo = (id: string) => {
    setOpen(false);
    const section = document.getElementById(id);
    if (!section) return;
    const el =
      id === "servicios" || id === "contacto"
        ? section.querySelector<HTMLElement>("[data-nav-anchor]") ?? section
        : section;

    window.requestAnimationFrame(() => {
      const navbarOffset = getNavbarOffset();
      const y = el.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    });
  };

  const scrollToTop = () => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div data-navbar-bar className="container mx-auto flex items-center justify-between h-16 px-4">
        <button
          type="button"
          onClick={scrollToTop}
          className="font-display text-2xl tracking-widest"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          <span className="text-primary">BARBER</span>{" "}
          <span className="text-foreground">SHOP</span>
        </button>

        <ul className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="md:hidden text-foreground" onClick={() => setOpen((prev) => !prev)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <ul className="flex flex-col p-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(item.id);
                    }}
                    className="block w-full rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary transition-colors uppercase tracking-wider"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
