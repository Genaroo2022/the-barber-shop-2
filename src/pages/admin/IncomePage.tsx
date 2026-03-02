import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { IncomeMetricsResponse, CreateManualIncomeRequest, ManualIncomeEntryResponse } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MonthInput } from "@/components/common/MonthInput";
import { Label } from "@/components/ui/label";

export default function IncomePage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ManualIncomeEntryResponse | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<ManualIncomeEntryResponse | null>(null);
  const [form, setForm] = useState<CreateManualIncomeRequest>({
    amount: 0,
    tipAmount: 0,
    occurredOn: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: income } = useQuery({
    queryKey: ["admin-income", month],
    queryFn: () => api.get<IncomeMetricsResponse>(`/api/admin/metrics/income?month=${month}`),
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateManualIncomeRequest) =>
      editing ? api.put(`/api/admin/metrics/income/manual/${editing.id}`, data) : api.post("/api/admin/metrics/income/manual", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-income"] });
      setDialogOpen(false);
      setEditing(null);
      toast({ title: editing ? "Ingreso actualizado" : "Ingreso creado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo guardar el ingreso";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/metrics/income/manual/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-income"] });
      toast({ title: "Ingreso eliminado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo eliminar el ingreso";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ amount: 0, tipAmount: 0, occurredOn: format(new Date(), "yyyy-MM-dd") });
    setDialogOpen(true);
  };

  const openEdit = (entry: ManualIncomeEntryResponse) => {
    setEditing(entry);
    setForm({ amount: entry.amount, tipAmount: entry.tipAmount, occurredOn: entry.occurredOn, notes: entry.notes || undefined });
    setDialogOpen(true);
  };

  const isIncomeFormValid =
    Number.isFinite(form.amount) &&
    form.amount >= 0 &&
    Number.isFinite(form.tipAmount) &&
    form.tipAmount >= 0 &&
    !!form.occurredOn &&
    new Date(form.occurredOn).getTime() <= Date.now() &&
    (form.notes?.length ?? 0) <= 255;

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center gap-3">
        <MonthInput value={month} onChange={setMonth} />
        <Button onClick={openNew} size="sm">
          <Plus size={14} className="mr-1" /> Ingreso manual
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Registrados" value={income?.registeredIncome ?? 0} />
        <StatCard label="Manuales" value={income?.manualIncome ?? 0} />
        <StatCard label="Propinas" value={income?.totalTips ?? 0} />
        <StatCard label="Total" value={income?.totalIncome ?? 0} highlight />
      </div>

      <div className="bg-card border border-border rounded-xl p-3 md:p-0">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Ingresos manuales
          </h3>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {income?.manualEntries?.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-foreground font-medium">{entry.occurredOn}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openEdit(entry)} className="text-muted-foreground hover:text-primary transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryToDelete(entry)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="text-foreground">Monto:</span> ${entry.amount.toLocaleString()}</p>
                <p><span className="text-foreground">Propina:</span> ${entry.tipAmount.toLocaleString()}</p>
                <p><span className="text-foreground">Total:</span> <span className="text-primary font-bold">${entry.total.toLocaleString()}</span></p>
                <p className="break-words"><span className="text-foreground">Notas:</span> {entry.notes || "-"}</p>
              </div>
            </div>
          ))}
          {(!income?.manualEntries || income.manualEntries.length === 0) && (
            <p className="p-6 text-center text-muted-foreground">Sin ingresos manuales</p>
          )}
        </div>

        <div className="hidden md:block overflow-x-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="p-3">Fecha</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Propina</th>
                <th className="p-3">Total</th>
                <th className="p-3">Notas</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {income?.manualEntries?.map((entry) => (
                <tr key={entry.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{entry.occurredOn}</td>
                  <td className="p-3 text-foreground whitespace-nowrap">${entry.amount.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">${entry.tipAmount.toLocaleString()}</td>
                  <td className="p-3 text-primary font-bold whitespace-nowrap">${entry.total.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground text-xs truncate">{entry.notes || "-"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(entry)} className="text-muted-foreground hover:text-primary transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryToDelete(entry)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!income?.manualEntries || income.manualEntries.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Sin ingresos manuales
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar ingreso" : "Nuevo ingreso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="manual-income-amount">Monto del servicio ($)</Label>
              <Input
                id="manual-income-amount"
                type="number"
                placeholder="Ej: 15000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value || 0) })}
                min={0}
                step={1}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-income-tip">Propina ($)</Label>
              <Input
                id="manual-income-tip"
                type="number"
                placeholder="Ej: 2000"
                value={form.tipAmount}
                onChange={(e) => setForm({ ...form, tipAmount: Number(e.target.value || 0) })}
                min={0}
                step={1}
                className="bg-background"
              />
            </div>
            <Input
              type="date"
              value={form.occurredOn}
              onChange={(e) => setForm({ ...form, occurredOn: e.target.value })}
              max={format(new Date(), "yyyy-MM-dd")}
              className="bg-background"
            />
            <Input
              placeholder="Notas (opcional)"
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value || undefined })}
              maxLength={255}
              className="bg-background"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!isIncomeFormValid}
              onClick={() => saveMutation.mutate({ ...form, notes: form.notes?.trim() || undefined })}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!entryToDelete}
        onOpenChange={(open) => {
          if (!open) setEntryToDelete(null);
        }}
        title="Eliminar ingreso manual"
        description="Esta acción no se puede deshacer."
        onConfirm={() => {
          if (!entryToDelete) return;
          deleteMutation.mutate(entryToDelete.id);
          setEntryToDelete(null);
        }}
      />
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? "bg-primary/10 border border-primary/30" : "bg-card border border-border"}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-primary" : "text-foreground"}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
        ${value.toLocaleString()}
      </p>
    </div>
  );
}
