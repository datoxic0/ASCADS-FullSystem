import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import UnifiedShell from "@/pages/UnifiedShell";
// import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <TooltipProvider>
      <UnifiedShell />
      <Toaster />
      <SonnerToaster theme="dark" position="bottom-right" />
      {/* <Analytics /> */}
    </TooltipProvider>
  );
}

export default App;
