import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { ClientSummaryResponse, MergeClientsRequest } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Merge, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
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
  const [clientToDelete, setClientToDelete] = useState<ClientSummaryResponse | null>(null);

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
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo actualizar el cliente";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      toast({ title: "Cliente eliminado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo eliminar el cliente";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const mergeMutation = useMutation({
    mutationFn: (data: MergeClientsRequest) => api.post("/api/admin/clients/merge", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      setMergeOpen(false);
      setMergeSource("");
      setMergeTarget("");
      toast({ title: "Clientes fusionados" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudieron fusionar los clientes";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const filtered = clients?.filter(
    (c) => c.clientName.toLowerCase().includes(search.toLowerCase()) || c.clientPhone.includes(search),
  );

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 bg-background"
        />
        <Button variant="outline" size="sm" onClick={() => setMergeOpen(true)}>
          <Merge size={14} className="mr-1" /> Fusionar
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 md:p-0">
        <div className="space-y-3 md:hidden">
          {filtered?.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-foreground font-medium truncate">{c.clientName}</p>
                  <p className="text-xs text-muted-foreground break-all">{c.clientPhone}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditClient(c);
                      setEditName(c.clientName);
                      setEditPhone(c.clientPhone);
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientToDelete(c)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="text-foreground">Citas:</span> {c.totalAppointments}</p>
                <p>
                  <span className="text-foreground">Última visita:</span>{" "}
                  {c.lastVisit ? format(new Date(c.lastVisit), "dd/MM/yyyy HH:mm") : "-"}
                </p>
              </div>
            </div>
          ))}
          {(!filtered || filtered.length === 0) && (
            <p className="p-6 text-center text-muted-foreground">Sin clientes</p>
          )}
        </div>

        <div className="hidden md:block overflow-x-hidden">
          <table className="w-full text-sm table-fixed">
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
              {filtered?.map((c) => (
                <tr key={c.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="p-3 text-foreground truncate">{c.clientName}</td>
                  <td className="p-3 text-muted-foreground truncate">{c.clientPhone}</td>
                  <td className="p-3 text-muted-foreground">{c.totalAppointments}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {c.lastVisit ? format(new Date(c.lastVisit), "dd/MM/yyyy HH:mm") : "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditClient(c);
                          setEditName(c.clientName);
                          setEditPhone(c.clientPhone);
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientToDelete(c)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!filtered || filtered.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Sin clientes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editClient} onOpenChange={() => setEditClient(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre"
              minLength={2}
              maxLength={120}
              className="bg-background"
            />
            <Input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="Telefono"
              minLength={7}
              maxLength={40}
              className="bg-background"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClient(null)}>
              Cancelar
            </Button>
            <Button
              disabled={editName.trim().length < 2 || editPhone.trim().length < 7}
              onClick={() => {
                if (!editClient) return;
                updateMutation.mutate({
                  id: editClient.id,
                  name: editName.trim(),
                  phone: editPhone.trim(),
                });
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Fusionar clientes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Selecciona el cliente origen (se elimina) y el destino (se conserva).
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Origen (se elimina)</label>
              <select
                value={mergeSource}
                onChange={(e) => setMergeSource(e.target.value)}
                className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground"
              >
                <option value="">Seleccionar...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.clientName} - {c.clientPhone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Destino (se conserva)</label>
              <select
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground"
              >
                <option value="">Seleccionar...</option>
                {clients
                  ?.filter((c) => c.id !== mergeSource)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientName} - {c.clientPhone}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!mergeSource || !mergeTarget || mergeSource === mergeTarget}
              onClick={() => mergeMutation.mutate({ sourceClientId: mergeSource, targetClientId: mergeTarget })}
            >
              Fusionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!clientToDelete}
        onOpenChange={(open) => {
          if (!open) setClientToDelete(null);
        }}
        title="Eliminar cliente"
        description={
          clientToDelete
            ? `Se eliminará a ${clientToDelete.clientName}. Si tiene turnos asociados, la operación será bloqueada.`
            : ""
        }
        onConfirm={() => {
          if (!clientToDelete) return;
          deleteMutation.mutate(clientToDelete.id);
          setClientToDelete(null);
        }}
      />
    </div>
  );
}
