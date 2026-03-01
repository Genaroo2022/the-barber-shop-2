import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import type { GalleryImageResponse } from "@/lib/types";

export default function GallerySection() {
  const [selected, setSelected] = useState<GalleryImageResponse | null>(null);

  const { data: images, isLoading } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: () => api.get<GalleryImageResponse[]>("/api/public/gallery"),
  });

  const categories = [...new Set(images?.filter(i => i.category).map(i => i.category) || [])];
  const [filter, setFilter] = useState<string | null>(null);
  const filtered = images?.filter(i => i.active && (!filter || i.category === filter)) || [];

  return (
    <section id="galeria" className="py-24 px-4 bg-card/50">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-2">Nuestro trabajo</p>
          <h2 className="text-5xl md:text-7xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Galería
          </h2>
        </motion.div>

        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <button
              onClick={() => setFilter(null)}
              className={`px-4 py-2 text-sm uppercase tracking-wider border rounded transition-all ${
                !filter ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat!)}
                className={`px-4 py-2 text-sm uppercase tracking-wider border rounded transition-all ${
                  filter === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-card border border-border rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="aspect-square relative overflow-hidden rounded-lg cursor-pointer group"
                onClick={() => setSelected(img)}
              >
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-foreground font-medium text-sm">{img.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-4"
              onClick={() => setSelected(null)}
            >
              <button
                className="absolute top-6 right-6 text-foreground hover:text-primary transition-colors"
                onClick={() => setSelected(null)}
              >
                <X size={32} />
              </button>
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                src={selected.imageUrl}
                alt={selected.title}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
