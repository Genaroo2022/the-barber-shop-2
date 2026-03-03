import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { AdminBarberUpsertRequest, BarberResponse } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export default function BarbersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BarberResponse | null>(null);
  const [barberToDelete, setBarberToDelete] = useState<BarberResponse | null>(null);
  const [form, setForm] = useState<AdminBarberUpsertRequest>({
    name: "",
    sortOrder: 0,
    active: true,
  });

  const { data: barbers } = useQuery({
    queryKey: ["admin-barbers"],
    queryFn: () => api.get<BarberResponse[]>("/api/admin/barbers"),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: AdminBarberUpsertRequest) =>
      editing ? api.put<BarberResponse>(`/api/admin/barbers/${editing.id}`, payload) : api.post<BarberResponse>("/api/admin/barbers", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-barbers"] });
      setDialogOpen(false);
      setEditing(null);
      toast({ title: editing ? "Barbero actualizado" : "Barbero creado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo guardar el barbero";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/barbers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-barbers"] });
      toast({ title: "Barbero eliminado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo eliminar el barbero";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", sortOrder: 0, active: true });
    setDialogOpen(true);
  };

  const openEdit = (barber: BarberResponse) => {
    setEditing(barber);
    setForm({
      name: barber.name,
      sortOrder: barber.sortOrder,
      active: barber.active,
    });
    setDialogOpen(true);
  };

  const isFormValid = form.name.trim().length >= 2 && form.name.trim().length <= 120 && form.sortOrder >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{barbers?.length ?? 0} barberos</p>
        <Button onClick={openNew} size="sm">
          <Plus size={14} className="mr-1" /> Nuevo barbero
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {barbers?.map((barber) => (
          <div key={barber.id} className={`bg-card border rounded-xl p-5 transition-all ${barber.active ? "border-border" : "border-border opacity-50"}`}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl text-foreground" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {barber.name}
              </h3>
              <div className="flex gap-1">
                <button onClick={() => openEdit(barber)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setBarberToDelete(barber)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Orden: {barber.sortOrder}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${barber.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {barber.active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar barbero" : "Nuevo barbero"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nombre"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              minLength={2}
              maxLength={120}
              className="bg-background"
            />
            <Input
              type="number"
              placeholder="Orden"
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value || 0) })}
              min={0}
              step={1}
              className="bg-background"
            />
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(value) => setForm({ ...form, active: value })} />
              <span className="text-sm text-muted-foreground">Activo</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!isFormValid}
              onClick={() =>
                saveMutation.mutate({
                  ...form,
                  name: form.name.trim(),
                })
              }
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!barberToDelete}
        onOpenChange={(open) => {
          if (!open) setBarberToDelete(null);
        }}
        title="Eliminar barbero"
        description={
          barberToDelete
            ? `Se eliminará el barbero ${barberToDelete.name}. Esta acción no se puede deshacer.`
            : ""
        }
        onConfirm={() => {
          if (!barberToDelete) return;
          deleteMutation.mutate(barberToDelete.id);
          setBarberToDelete(null);
        }}
      />
    </div>
  );
}

