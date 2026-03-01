import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OverviewMetricsResponse, IncomeMetricsResponse } from "@/lib/types";
import { CalendarDays, Users, CheckCircle, Clock, Star, DollarSign } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function DashboardPage() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));

  const { data: overview } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api.get<OverviewMetricsResponse>("/api/admin/metrics/overview"),
  });

  const { data: income } = useQuery({
    queryKey: ["admin-income", month],
    queryFn: () => api.get<IncomeMetricsResponse>(`/api/admin/metrics/income?month=${month}`),
  });

  const cards = [
    { label: "Turnos totales", value: overview?.totalAppointments ?? 0, icon: CalendarDays, color: "text-primary" },
    { label: "Pendientes", value: overview?.pendingAppointments ?? 0, icon: Clock, color: "text-yellow-500" },
    { label: "Completados", value: overview?.completedAppointments ?? 0, icon: CheckCircle, color: "text-green-500" },
    { label: "Clientes únicos", value: overview?.uniqueClients ?? 0, icon: Users, color: "text-blue-400" },
    { label: "Servicio popular", value: overview?.popularService ?? "-", icon: Star, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon size={16} className={c.color} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              {typeof c.value === "number" ? c.value.toLocaleString() : c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Income */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-primary" />
            <h3 className="text-xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Ingresos</h3>
          </div>
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-40 bg-background" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MiniCard label="Registrados" value={`$${income?.registeredIncome?.toLocaleString() ?? 0}`} />
          <MiniCard label="Manuales" value={`$${income?.manualIncome?.toLocaleString() ?? 0}`} />
          <MiniCard label="Propinas" value={`$${income?.totalTips?.toLocaleString() ?? 0}`} />
          <MiniCard label="Total" value={`$${income?.totalIncome?.toLocaleString() ?? 0}`} highlight />
        </div>

        {income?.breakdown && income.breakdown.length > 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={income.breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
              <XAxis dataKey="serviceName" tick={{ fill: "hsl(0 0% 55%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(0 0% 55%)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }}
                labelStyle={{ color: "hsl(0 0% 95%)" }}
              />
              <Bar dataKey="total" fill="hsl(82 85% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function MiniCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? "bg-primary/10 border border-primary/30" : "bg-secondary"}`}>
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className={`text-lg font-bold ${highlight ? "text-primary" : "text-foreground"}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
        {value}
      </p>
    </div>
  );
}
