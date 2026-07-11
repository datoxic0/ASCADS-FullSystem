import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import UnifiedShell from "@/pages/UnifiedShell";
import AuthPage from "@/pages/Auth";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

function Gate() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  return session ? <UnifiedShell /> : <AuthPage />;
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Gate />
        <Toaster />
        <SonnerToaster theme="dark" position="bottom-right" />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
