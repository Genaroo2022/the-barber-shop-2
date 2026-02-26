import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ClientSummaryResponse, MergeClientsRequest } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Merge, Pencil, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ClientsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editClient, setEditClient] = useState<ClientSummaryResponse | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  const { data: clients } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => api.get<ClientSummaryResponse[]>("/api/admin/clients"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, phone }: { id: string; name: string; phone: string }) =>
      api.put(`/api/admin/clients/${id}`, { name, phone }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      setEditClient(null);
      toast({ title: "Cliente actualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      toast({ title: "Cliente eliminado" });
    },
  });

  const mergeMutation = useMutation({
    mutationFn: (data: MergeClientsRequest) => api.post("/api/admin/clients/merge", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      setMergeOpen(false);
      toast({ title: "Clientes fusionados" });
    },
  });

  const filtered = clients?.filter(c =>
    c.clientName.toLowerCase().includes(search.toLowerCase()) ||
    c.clientPhone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="w-64 bg-background" />
        <Button variant="outline" size="sm" onClick={() => setMergeOpen(true)}>
          <Merge size={14} className="mr-1" /> Fusionar
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="p-3">Nombre</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Citas</th>
                <th className="p-3">Última visita</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="p-3 text-foreground">{c.clientName}</td>
                  <td className="p-3 text-muted-foreground">{c.clientPhone}</td>
                  <td className="p-3 text-muted-foreground">{c.totalAppointments}</td>
                  <td className="p-3 text-muted-foreground">{c.lastVisit || "-"}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => { setEditClient(c); setEditName(c.clientName); setEditPhone(c.clientPhone); }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editClient} onOpenChange={() => setEditClient(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" className="bg-background" />
            <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Teléfono" className="bg-background" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClient(null)}>Cancelar</Button>
            <Button onClick={() => editClient && updateMutation.mutate({ id: editClient.id, name: editName, phone: editPhone })}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge dialog */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Fusionar clientes</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Seleccioná el cliente origen (se elimina) y el destino (se conserva).</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Origen (se elimina)</label>
              <select value={mergeSource} onChange={e => setMergeSource(e.target.value)} className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground">
                <option value="">Seleccionar...</option>
                {clients?.map(c => <option key={c.id} value={c.id}>{c.clientName} - {c.clientPhone}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Destino (se conserva)</label>
              <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground">
                <option value="">Seleccionar...</option>
                {clients?.filter(c => c.id !== mergeSource).map(c => <option key={c.id} value={c.id}>{c.clientName} - {c.clientPhone}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>Cancelar</Button>
            <Button disabled={!mergeSource || !mergeTarget} onClick={() => mergeMutation.mutate({ sourceClientId: mergeSource, targetClientId: mergeTarget })}>
              Fusionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
