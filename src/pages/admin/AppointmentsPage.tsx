import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import type {
  AppointmentResponse,
  StalePendingAppointmentResponse,
  AppointmentStatus,
  BarberResponse,
  UpdateAppointmentBarberRequest,
} from "@/lib/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MonthInput } from "@/components/common/MonthInput";
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
const STALE_MINUTE_OPTIONS = [30, 60, 90, 120, 180, 240];
const MONTH_PARAM_REGEX = /^\d{4}-\d{2}$/;

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMonth = searchParams.get("month");
  const initialBarberId = searchParams.get("barberId");
  const initialOlderThanMinutes = Number(searchParams.get("olderThanMinutes") ?? "");

  const [month, setMonth] = useState(
    initialMonth && MONTH_PARAM_REGEX.test(initialMonth) ? initialMonth : format(new Date(), "yyyy-MM"),
  );
  const [showStale, setShowStale] = useState(false);
  const [olderThanMinutes, setOlderThanMinutes] = useState(
    STALE_MINUTE_OPTIONS.includes(initialOlderThanMinutes) ? initialOlderThanMinutes : 120,
  );
  const [selectedBarberId, setSelectedBarberId] = useState<string>(
    initialBarberId && initialBarberId.trim() ? initialBarberId : "all",
  );
  const [appointmentToDelete, setAppointmentToDelete] = useState<AppointmentResponse | null>(null);
  const previousCountRef = useRef(0);

  const barberFilterQuery =
    selectedBarberId !== "all" ? `&barberId=${encodeURIComponent(selectedBarberId)}` : "";

  const { data: appointments } = useQuery({
    queryKey: ["admin-appointments", month, selectedBarberId],
    queryFn: () => api.get<AppointmentResponse[]>(`/api/admin/appointments?month=${month}${barberFilterQuery}`),
    refetchInterval: 30_000,
  });

  const { data: stale } = useQuery({
    queryKey: ["admin-stale", olderThanMinutes, selectedBarberId],
    queryFn: () =>
      api.get<StalePendingAppointmentResponse[]>(
        `/api/admin/appointments/stale-pending?olderThanMinutes=${olderThanMinutes}${barberFilterQuery}`,
      ),
    enabled: showStale,
  });

  const { data: barbers } = useQuery({
    queryKey: ["admin-barbers"],
    queryFn: () => api.get<BarberResponse[]>("/api/admin/barbers"),
  });

  useEffect(() => {
    const currentCount = appointments?.length ?? 0;
    if (previousCountRef.current > 0 && currentCount > previousCountRef.current) {
      toast({
        title: "Nuevos turnos",
        description: `Llegaron ${currentCount - previousCountRef.current} turno(s) nuevo(s).`,
      });
    }
    previousCountRef.current = currentCount;
  }, [appointments, toast]);

  useEffect(() => {
    const next = new URLSearchParams();
    next.set("month", month);
    next.set("olderThanMinutes", String(olderThanMinutes));
    if (selectedBarberId !== "all") {
      next.set("barberId", selectedBarberId);
    }
    setSearchParams(next, { replace: true });
  }, [month, olderThanMinutes, selectedBarberId, setSearchParams]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch(`/api/admin/appointments/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast({ title: "Estado actualizado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo actualizar el estado";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/appointments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast({ title: "Turno eliminado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo eliminar el turno";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const barberMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAppointmentBarberRequest }) =>
      api.patch(`/api/admin/appointments/${id}/barber`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast({ title: "Barbero asignado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo asignar el barbero";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const allStatuses: AppointmentStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center gap-3">
        <MonthInput value={month} onChange={setMonth} />
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="barber-filter" className="text-sm text-muted-foreground whitespace-nowrap">
            Barbero
          </label>
          <select
            id="barber-filter"
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="all">Todos</option>
            {(barbers ?? []).map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="stale-threshold" className="text-sm text-muted-foreground whitespace-nowrap">
            Marcar como estancado si supera
          </label>
          <select
            id="stale-threshold"
            value={String(olderThanMinutes)}
            onChange={(e) => setOlderThanMinutes(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {STALE_MINUTE_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutos
              </option>
            ))}
          </select>
        </div>
        <Button variant={showStale ? "default" : "outline"} size="sm" onClick={() => setShowStale(!showStale)}>
          <AlertTriangle size={14} className="mr-1" /> Pendientes estancados
        </Button>
      </div>

      {showStale && stale && stale.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <h4 className="text-sm font-medium text-yellow-400 mb-3">Pendientes estancados ({stale.length})</h4>
          <div className="space-y-2">
            {stale.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm p-2 bg-card rounded-lg">
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

      <div className="bg-card border border-border rounded-xl p-3 md:p-0">
        <div className="space-y-3 md:hidden">
          {appointments?.map((a) => (
            <div key={a.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-foreground font-medium truncate">{a.clientName}</p>
                  <p className="text-xs text-muted-foreground break-all">{a.clientPhone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAppointmentToDelete(a)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="text-foreground">Servicio:</span> {a.serviceName}</p>
                <p><span className="text-foreground">Barbero:</span> {a.barberName}</p>
                <p><span className="text-foreground">Fecha:</span> {format(new Date(a.appointmentAt), "dd/MM HH:mm")}</p>
                <p><span className="text-foreground">Precio:</span> ${a.servicePrice.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Asignar barbero</label>
                <select
                  value={a.barberId}
                  onChange={(e) => barberMutation.mutate({ id: a.id, payload: { barberId: e.target.value } })}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
                  disabled={barberMutation.isPending}
                >
                  {(barbers ?? []).map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name}
                    </option>
                  ))}
                </select>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${STATUS_COLORS[a.status]}`}>
                    {a.status} <ChevronDown size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {allStatuses.map((s) => (
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
            </div>
          ))}
          {(!appointments || appointments.length === 0) && (
            <p className="p-6 text-center text-muted-foreground">Sin turnos</p>
          )}
        </div>

        <div className="hidden md:block overflow-x-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="p-3">Cliente</th>
                <th className="p-3">Servicio</th>
                <th className="p-3">Barbero</th>
                <th className="p-3">Fecha/Hora</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Estado</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {appointments?.map((a) => (
                <tr key={a.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="p-3">
                    <p className="text-foreground truncate">{a.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.clientPhone}</p>
                  </td>
                  <td className="p-3 text-muted-foreground truncate">{a.serviceName}</td>
                  <td className="p-3">
                    <select
                      value={a.barberId}
                      onChange={(e) => barberMutation.mutate({ id: a.id, payload: { barberId: e.target.value } })}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
                      disabled={barberMutation.isPending}
                    >
                      {(barbers ?? []).map((barber) => (
                        <option key={barber.id} value={barber.id}>
                          {barber.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{format(new Date(a.appointmentAt), "dd/MM HH:mm")}</td>
                  <td className="p-3 text-foreground whitespace-nowrap">${a.servicePrice.toLocaleString()}</td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${STATUS_COLORS[a.status]}`}>
                          {a.status} <ChevronDown size={12} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {allStatuses.map((s) => (
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
                      type="button"
                      onClick={() => setAppointmentToDelete(a)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {(!appointments || appointments.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">Sin turnos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!appointmentToDelete}
        onOpenChange={(open) => {
          if (!open) setAppointmentToDelete(null);
        }}
        title="Eliminar turno"
        description={
          appointmentToDelete
            ? `Se eliminará el turno de ${appointmentToDelete.clientName}. Esta acción no se puede deshacer.`
            : ""
        }
        onConfirm={() => {
          if (!appointmentToDelete) return;
          deleteMutation.mutate(appointmentToDelete.id);
          setAppointmentToDelete(null);
        }}
      />
    </div>
  );
}





