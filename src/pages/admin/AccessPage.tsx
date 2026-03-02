import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  AdminUserCreateRequest,
  AdminUserResponse,
  AdminUserUpdateRequest,
} from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export default function AccessPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);
  const [adminToDelete, setAdminToDelete] = useState<AdminUserResponse | null>(null);

  const { data: admins } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<AdminUserResponse[]>("/api/admin/admin-users"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: AdminUserCreateRequest) => api.post<AdminUserResponse>("/api/admin/admin-users", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEmail("");
      setActive(true);
      toast({ title: "Administrador agregado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo crear el administrador";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminUserUpdateRequest }) =>
      api.patch<AdminUserResponse>(`/api/admin/admin-users/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo actualizar el administrador";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/admin-users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Administrador eliminado" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo eliminar el administrador";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const onCreate = () => {
    const normalizedEmail = email.trim().toLowerCase();
    createMutation.mutate({
      email: normalizedEmail,
      active,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-lg" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          Nuevo administrador
        </h3>
        <p className="text-sm text-muted-foreground">
          Solo los emails listados aquí podrán iniciar sesión con Google en el panel.
        </p>
        <div className="grid gap-3">
          <Input
            placeholder="Email Google autorizado"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background"
            maxLength={120}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} />
          <span className="text-sm text-muted-foreground">Activo</span>
        </div>
        <Button
          onClick={onCreate}
          disabled={!email.trim() || createMutation.isPending}
          className="bg-primary text-primary-foreground"
        >
          Agregar administrador
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 md:p-0">
        <div className="hidden md:block overflow-x-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="p-3">Email</th>
                <th className="p-3">Activo</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {admins?.map((admin) => (
                <tr key={admin.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="p-3 text-foreground truncate">{admin.email ?? "-"}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={admin.active}
                        onCheckedChange={(checked) => updateMutation.mutate({ id: admin.id, payload: { active: checked } })}
                      />
                      <span className="text-muted-foreground">{admin.active ? "Activo" : "Inactivo"}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => setAdminToDelete(admin)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {(!admins || admins.length === 0) && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">Sin administradores</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {admins?.map((admin) => (
            <div key={admin.id} className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-foreground break-all">{admin.email ?? "-"}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={admin.active}
                    onCheckedChange={(checked) => updateMutation.mutate({ id: admin.id, payload: { active: checked } })}
                  />
                  <span className="text-sm text-muted-foreground">{admin.active ? "Activo" : "Inactivo"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminToDelete(admin)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {(!admins || admins.length === 0) && (
            <p className="p-6 text-center text-muted-foreground">Sin administradores</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!adminToDelete}
        onOpenChange={(open) => {
          if (!open) setAdminToDelete(null);
        }}
        title="Eliminar administrador"
        description={
          adminToDelete
            ? `Se eliminará el acceso de ${adminToDelete.email ?? "este usuario"}.`
            : ""
        }
        onConfirm={() => {
          if (!adminToDelete) return;
          deleteMutation.mutate(adminToDelete.id);
          setAdminToDelete(null);
        }}
      />
    </div>
  );
}

