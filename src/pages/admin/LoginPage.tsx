import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, loginWithFirebase } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { ADMIN_ROUTE } from "@/lib/routes";
import { isFirebaseConfigured, signInWithGooglePopup } from "@/lib/firebase";

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: "Error", description: "Completá email y contraseña", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(ADMIN_ROUTE);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al iniciar sesión";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoadingGoogle(true);
      const user = await signInWithGooglePopup();
      const idToken = await user.getIdToken(true);
      await loginWithFirebase(idToken);
      navigate(ADMIN_ROUTE);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo iniciar con Google";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-5xl mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            <span className="text-primary">BARBER</span> SHOP
          </h1>
          <p className="text-muted-foreground text-sm">Panel de administración</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              maxLength={120}
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Contraseña</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="bg-background" />
          </div>
          <Button
            type="submit"
            disabled={loading || !email.trim() || password.length < 8}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Ingresar"}
          </Button>
          {isFirebaseConfigured() && (
            <Button
              type="button"
              variant="outline"
              disabled={loadingGoogle}
              className="w-full"
              onClick={handleGoogle}
            >
              {loadingGoogle ? <Loader2 className="animate-spin mr-2" size={18} /> : <Chrome className="mr-2" size={16} />} 
              Ingresar con Google
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

