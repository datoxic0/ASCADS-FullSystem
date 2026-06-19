import { AlertTriangle, Activity, CircuitBoard, Layers, Info } from "lucide-react";

type Props = {
  gateCount: number;
  wireCount: number;
  iterations: number;
  oscillating: boolean;
  zoom: number;
  cursor?: { x: number; y: number } | null;
  onAboutClick?: () => void;
};

export function StatusBar({
  gateCount,
  wireCount,
  iterations,
  oscillating,
  zoom,
  cursor,
  onAboutClick,
}: Props) {
  return (
    <footer className="h-7 shrink-0 border-t border-border bg-card/70 backdrop-blur-sm px-3 flex items-center gap-4 text-[11px] text-muted-foreground font-mono">
      <span className="flex items-center gap-1.5">
        <CircuitBoard className="h-3 w-3" />
        {gateCount} gates
      </span>
      <span className="flex items-center gap-1.5">
        <Layers className="h-3 w-3" />
        {wireCount} wires
      </span>
      <span className="flex items-center gap-1.5">
        <Activity className="h-3 w-3" />
        {iterations} iter
      </span>
      {oscillating && (
        <span
          className="flex items-center gap-1.5 text-destructive"
          title="The circuit did not stabilize. Possible feedback oscillation."
        >
          <AlertTriangle className="h-3 w-3" />
          oscillating
        </span>
      )}
      <div className="flex-1" />
      <button
        type="button"
        onClick={onAboutClick}
        className="hidden md:flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-0.5 rounded text-muted-foreground hover:text-foreground/90 cursor-pointer"
        data-testid="status-credit"
      >
        <Info className="h-3 w-3" />
        <span className="font-sans tracking-wide">
          Developed by Siyabonga B Phakathi · Voice and Eye of Bhambatha Inc. · ©2026
        </span>
      </button>
      {cursor && (
        <span className="hidden sm:inline">
          x:{cursor.x.toFixed(0)} y:{cursor.y.toFixed(0)}
        </span>
      )}
      <span>{Math.round(zoom * 100)}%</span>
    </footer>
  );
}
