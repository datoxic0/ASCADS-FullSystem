import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import UnifiedShell from "@/pages/UnifiedShell";
import AuthPage from "@/pages/Auth";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

function Gate() {
  // Completely bypass Supabase Auth for local offline environment!
  return <UnifiedShell />;
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
