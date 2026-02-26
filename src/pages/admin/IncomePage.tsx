import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { IncomeMetricsResponse, CreateManualIncomeRequest, ManualIncomeEntryResponse } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";

export default function IncomePage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ManualIncomeEntryResponse | null>(null);
  const [form, setForm] = useState<CreateManualIncomeRequest>({ amount: 0, tipAmount: 0, occurredOn: format(new Date(), "yyyy-MM-dd") });

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
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/metrics/income/manual/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-income"] });
      toast({ title: "Ingreso eliminado" });
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ amount: 0, tipAmount: 0, occurredOn: format(new Date(), "yyyy-MM-dd") });
    setDialogOpen(true);
  };

  const openEdit = (e: ManualIncomeEntryResponse) => {
    setEditing(e);
    setForm({ amount: e.amount, tipAmount: e.tipAmount, occurredOn: e.occurredOn, notes: e.notes || undefined });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-40 bg-background" />
        <Button onClick={openNew} size="sm"><Plus size={14} className="mr-1" /> Ingreso manual</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Registrados" value={income?.registeredIncome ?? 0} />
        <StatCard label="Manuales" value={income?.manualIncome ?? 0} />
        <StatCard label="Propinas" value={income?.totalTips ?? 0} />
        <StatCard label="Total" value={income?.totalIncome ?? 0} highlight />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Ingresos manuales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
              {income?.manualEntries?.map(e => (
                <tr key={e.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="p-3 text-muted-foreground">{e.occurredOn}</td>
                  <td className="p-3 text-foreground">${e.amount.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground">${e.tipAmount.toLocaleString()}</td>
                  <td className="p-3 text-primary font-bold">${e.total.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground text-xs">{e.notes || "-"}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => openEdit(e)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => deleteMutation.mutate(e.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {(!income?.manualEntries || income.manualEntries.length === 0) && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin ingresos manuales</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editing ? "Editar ingreso" : "Nuevo ingreso"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" placeholder="Monto" value={form.amount} onChange={e => setForm({ ...form, amount: +e.target.value })} className="bg-background" />
            <Input type="number" placeholder="Propina" value={form.tipAmount} onChange={e => setForm({ ...form, tipAmount: +e.target.value })} className="bg-background" />
            <Input type="date" value={form.occurredOn} onChange={e => setForm({ ...form, occurredOn: e.target.value })} className="bg-background" />
            <Input placeholder="Notas (opcional)" value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value || undefined })} className="bg-background" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
