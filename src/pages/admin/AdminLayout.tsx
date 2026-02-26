import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated, logout } from "@/lib/auth";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Image,
  DollarSign,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const LINKS = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/appointments", icon: CalendarDays, label: "Turnos" },
  { to: "/admin/clients", icon: Users, label: "Clientes" },
  { to: "/admin/services", icon: Scissors, label: "Servicios" },
  { to: "/admin/gallery", icon: Image, label: "Galería" },
  { to: "/admin/income", icon: DollarSign, label: "Ingresos" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />;

  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="text-xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            <span className="text-primary">BARBER</span> SHOP
          </Link>
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(l.to, l.end)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <l.icon size={18} />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={() => { logout(); window.location.href = "/admin/login"; }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 gap-3">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-medium" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {LINKS.find((l) => isActive(l.to, l.end))?.label || "Admin"}
          </h2>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
