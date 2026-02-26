import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GalleryImageResponse, AdminGalleryImageUpsertRequest, AdminGalleryUploadSignatureResponse } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function GalleryPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryImageResponse | null>(null);
  const [form, setForm] = useState<AdminGalleryImageUpsertRequest>({ title: "", imageUrl: "", sortOrder: 0, active: true });
  const [uploading, setUploading] = useState(false);

  const { data: images } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => api.get<GalleryImageResponse[]>("/api/admin/gallery"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: AdminGalleryImageUpsertRequest) =>
      editing ? api.put(`/api/admin/gallery/${editing.id}`, data) : api.post("/api/admin/gallery", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      setDialogOpen(false);
      setEditing(null);
      toast({ title: editing ? "Imagen actualizada" : "Imagen creada" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/gallery/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      toast({ title: "Imagen eliminada" });
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const sig = await api.get<AdminGalleryUploadSignatureResponse>("/api/admin/gallery/upload-signature");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      setForm({ ...form, imageUrl: data.secure_url });
    } catch {
      toast({ title: "Error al subir imagen", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", imageUrl: "", sortOrder: (images?.length ?? 0) + 1, active: true });
    setDialogOpen(true);
  };

  const openEdit = (img: GalleryImageResponse) => {
    setEditing(img);
    setForm({ title: img.title, category: img.category || undefined, imageUrl: img.imageUrl, sortOrder: img.sortOrder, active: img.active });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{images?.length ?? 0} imágenes</p>
        <Button onClick={openNew} size="sm"><Plus size={14} className="mr-1" /> Nueva imagen</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images?.sort((a, b) => a.sortOrder - b.sortOrder).map(img => (
          <div key={img.id} className={`relative group rounded-xl overflow-hidden border ${img.active ? "border-border" : "border-border opacity-50"}`}>
            <img src={img.imageUrl} alt={img.title} className="w-full aspect-square object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => openEdit(img)} className="p-2 bg-card rounded-lg hover:bg-primary/20 transition-colors"><Pencil size={16} className="text-primary" /></button>
              <button onClick={() => deleteMutation.mutate(img.id)} className="p-2 bg-card rounded-lg hover:bg-destructive/20 transition-colors"><Trash2 size={16} className="text-destructive" /></button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2">
              <p className="text-xs text-foreground truncate">{img.title}</p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editing ? "Editar imagen" : "Nueva imagen"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-background" />
            <Input placeholder="Categoría (opcional)" value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value || undefined })} className="bg-background" />
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Imagen</label>
              <div className="flex gap-2">
                <Input placeholder="URL de imagen" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="bg-background flex-1" />
                <Button variant="outline" size="icon" className="relative" disabled={uploading}>
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  />
                </Button>
              </div>
            </div>
            <Input type="number" placeholder="Orden" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: +e.target.value })} className="bg-background" />
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
              <span className="text-sm text-muted-foreground">Activa</span>
            </div>
            {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.title || !form.imageUrl}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
