import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithFirebase } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { ADMIN_ROUTE } from "@/lib/routes";
import { isFirebaseConfigured, signInWithGooglePopup } from "@/lib/firebase";

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogle = async () => {
    try {
      if (!isFirebaseConfigured()) {
        toast({
          title: "Firebase no configurado",
          description: "Completá VITE_FIREBASE_* en el entorno del frontend.",
          variant: "destructive",
        });
        return;
      }
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
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <Button
            type="button"
            disabled={loadingGoogle}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider"
            onClick={handleGoogle}
          >
            {loadingGoogle ? <Loader2 className="animate-spin mr-2" size={18} /> : <Chrome className="mr-2" size={16} />}
            Ingresar con Google
          </Button>
        </div>
      </div>
    </div>
  );
}


