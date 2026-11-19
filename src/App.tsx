import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import UnifiedShell from "@/pages/UnifiedShell";

// Offline local boot — no auth gate.
// The Lovable/Supabase auth scaffolding (src/pages/Auth.tsx, src/hooks/useAuth.tsx,
// src/integrations/supabase/) remains in-tree but is disconnected from boot:
// it is a mock sign-in that cannot complete here and blocked this app.
// UnifiedShell's cloud sync stays inert because useAuth() has no session.
function App() {
  return (
    <TooltipProvider>
      <UnifiedShell />
      <Toaster />
      <SonnerToaster theme="dark" position="bottom-right" />
    </TooltipProvider>
  );
}

export default App;
