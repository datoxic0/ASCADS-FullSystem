import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import UnifiedShell from "@/pages/UnifiedShell";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <TooltipProvider>
      <UnifiedShell />
      <Toaster />
      <Analytics />
    </TooltipProvider>
  );
}

export default App;
