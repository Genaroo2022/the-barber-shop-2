import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { ServiceCatalogResponse, AdminServiceUpsertRequest } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export default function ServicesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCatalogResponse | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceCatalogResponse | null>(null);
  const [form, setForm] = useState<AdminServiceUpsertRequest>({
    name: "",
    price: 0,
    durationMinutes: 30,
    description: "",
    active: true,
  });

  const { data: services } = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => api.get<ServiceCatalogResponse[]>("/api/admin/services"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: AdminServiceUpsertRequest) =>
      editing ? api.put(`/api/admin/services/${editing.id}`, data) : api.post("/api/admin/services", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      setDialogOpen(false);
      setEditing(null);
      toast({ title: editing ? "Servicio actualizado" : "Servicio creado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo guardar el servicio";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/services/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      toast({ title: "Servicio eliminado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo eliminar el servicio";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", price: 0, durationMinutes: 30, description: "", active: true });
    setDialogOpen(true);
  };

  const openEdit = (s: ServiceCatalogResponse) => {
    setEditing(s);
    setForm({
      name: s.name,
      price: s.price,
      durationMinutes: s.durationMinutes,
      description: s.description || "",
      active: s.active,
    });
    setDialogOpen(true);
  };

  const isServiceFormValid =
    form.name.trim().length >= 2 &&
    form.name.trim().length <= 120 &&
    Number.isFinite(form.price) &&
    form.price >= 0 &&
    Number.isFinite(form.durationMinutes) &&
    form.durationMinutes >= 1 &&
    form.durationMinutes <= 600 &&
    (form.description?.length ?? 0) <= 500;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{services?.length ?? 0} servicios</p>
        <Button onClick={openNew} size="sm">
          <Plus size={14} className="mr-1" /> Nuevo servicio
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services?.map((s) => (
          <div key={s.id} className={`bg-card border rounded-xl p-5 transition-all ${s.active ? "border-border" : "border-border opacity-50"}`}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl text-foreground" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {s.name}
              </h3>
              <div className="flex gap-1">
                <button onClick={() => openEdit(s)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setServiceToDelete(s)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {s.description && <p className="text-sm text-muted-foreground mb-3">{s.description}</p>}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-primary font-bold">${s.price.toLocaleString()}</span>
              <span className="text-muted-foreground">{s.durationMinutes} min</span>
              <span className={`text-xs px-2 py-0.5 rounded ${s.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {s.active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              minLength={2}
              maxLength={120}
              className="bg-background"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Precio"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value || 0) })}
                min={0}
                step={1}
                className="bg-background"
              />
              <Input
                type="number"
                placeholder="Duracion (min)"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value || 0) })}
                min={1}
                max={600}
                step={1}
                className="bg-background"
              />
            </div>
            <Input
              placeholder="Descripcion"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              className="bg-background"
            />
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <span className="text-sm text-muted-foreground">Activo</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!isServiceFormValid}
              onClick={() =>
                saveMutation.mutate({
                  ...form,
                  name: form.name.trim(),
                  description: form.description?.trim() || undefined,
                })
              }
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!serviceToDelete}
        onOpenChange={(open) => {
          if (!open) setServiceToDelete(null);
        }}
        title="Eliminar servicio"
        description={
          serviceToDelete
            ? `Se eliminará el servicio ${serviceToDelete.name}. Esta acción no se puede deshacer.`
            : ""
        }
        onConfirm={() => {
          if (!serviceToDelete) return;
          deleteMutation.mutate(serviceToDelete.id);
          setServiceToDelete(null);
        }}
      />
    </div>
  );
}

