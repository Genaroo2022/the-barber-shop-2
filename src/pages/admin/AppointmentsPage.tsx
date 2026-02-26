import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AppointmentResponse, StalePendingAppointmentResponse, AppointmentStatus } from "@/lib/types";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  CONFIRMED: "bg-blue-500/20 text-blue-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  CANCELLED: "bg-red-500/20 text-red-400",
};

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [showStale, setShowStale] = useState(false);

  const { data: appointments } = useQuery({
    queryKey: ["admin-appointments", month],
    queryFn: () => api.get<AppointmentResponse[]>(`/api/admin/appointments?month=${month}`),
  });

  const { data: stale } = useQuery({
    queryKey: ["admin-stale"],
    queryFn: () => api.get<StalePendingAppointmentResponse[]>("/api/admin/appointments/stale-pending"),
    enabled: showStale,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch(`/api/admin/appointments/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast({ title: "Estado actualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/appointments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast({ title: "Turno eliminado" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-40 bg-background" />
        <Button variant={showStale ? "default" : "outline"} size="sm" onClick={() => setShowStale(!showStale)}>
          <AlertTriangle size={14} className="mr-1" /> Pendientes estancados
        </Button>
      </div>

      {showStale && stale && stale.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <h4 className="text-sm font-medium text-yellow-400 mb-3">Pendientes estancados ({stale.length})</h4>
          <div className="space-y-2">
            {stale.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm p-2 bg-card rounded-lg">
                <div>
                  <span className="text-foreground">{s.clientName}</span>
                  <span className="text-muted-foreground ml-2">• {s.serviceName}</span>
                </div>
                <span className="text-yellow-400">{s.minutesPending} min esperando</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="p-3">Cliente</th>
                <th className="p-3">Servicio</th>
                <th className="p-3">Fecha/Hora</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Estado</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {appointments?.map(a => (
                <tr key={a.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="p-3">
                    <p className="text-foreground">{a.clientName}</p>
                    <p className="text-xs text-muted-foreground">{a.clientPhone}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{a.serviceName}</td>
                  <td className="p-3 text-muted-foreground">{format(new Date(a.appointmentAt), "dd/MM HH:mm")}</td>
                  <td className="p-3 text-foreground">${a.servicePrice.toLocaleString()}</td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${STATUS_COLORS[a.status]}`}>
                          {a.status} <ChevronDown size={12} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as AppointmentStatus[]).map(s => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() => statusMutation.mutate({ id: a.id, status: s })}
                            disabled={s === a.status}
                          >
                            {s}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => deleteMutation.mutate(a.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {(!appointments || appointments.length === 0) && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin turnos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
