import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import UnifiedShell from "@/pages/UnifiedShell";

function App() {
  return (
    <TooltipProvider>
      <UnifiedShell />
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
