import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/admin/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import AppointmentsPage from "./pages/admin/AppointmentsPage";
import ClientsPage from "./pages/admin/ClientsPage";
import ServicesPage from "./pages/admin/ServicesPage";
import BarbersPage from "./pages/admin/BarbersPage";
import GalleryPage from "./pages/admin/GalleryPage";
import IncomePage from "./pages/admin/IncomePage";
import AccessPage from "./pages/admin/AccessPage";
import { ADMIN_ROUTE, LEGACY_ADMIN_ROUTE, LEGACY_LOGIN_ROUTE, LOGIN_ROUTE } from "./lib/routes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          {LOGIN_ROUTE !== LEGACY_LOGIN_ROUTE && <Route path={LEGACY_LOGIN_ROUTE} element={<NotFound />} />}
          {ADMIN_ROUTE !== LEGACY_ADMIN_ROUTE && <Route path={`${LEGACY_ADMIN_ROUTE}/*`} element={<NotFound />} />}
          <Route path={LOGIN_ROUTE} element={<LoginPage />} />
          <Route path={ADMIN_ROUTE} element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="barbers" element={<BarbersPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="access" element={<AccessPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
