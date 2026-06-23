import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Activity,
  ArrowRightLeft,
  ChevronDown,
  Download,
  FilePlus,
  Folder,
  HelpCircle,
  Info,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Save,
  SkipForward,
  Sparkles,
  Sun,
  Table2,
  Trash2,
  Undo2,
  Upload,
  Redo2,
  Tag,
  Zap,
  FunctionSquare,
} from "lucide-react";
import type { SymbolStyle } from "@/lib/types";
import { Logo } from "./Logo";

type Props = {
  circuitName: string;
  onCircuitNameChange: (n: string) => void;
  dirty: boolean;
  symbolStyle: SymbolStyle;
  onSetSymbolStyle: (s: SymbolStyle) => void;
  dark: boolean;
  onToggleDark: () => void;
  running: boolean;
  onToggleRunning: () => void;
  onStep: () => void;
  speed: number;
  onSpeedChange: (n: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onNew: () => void;
  onSaveClick: () => void;
  onOpenClick: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
  onExamplesClick: () => void;
  onHelpClick: () => void;
  onAboutClick: () => void;
  onTruthTableClick: () => void;
  showWaveforms: boolean;
  onToggleWaveforms: () => void;
  onResetSim: () => void;
  showSignalLabels: boolean;
  onToggleSignalLabels: () => void;
  onImportExpr: () => void;
  onExportToPLC?: () => void;
  onImportFromPLC?: () => void;
};

export function Toolbar({
  circuitName,
  onCircuitNameChange,
  dirty,
  symbolStyle,
  onSetSymbolStyle,
  dark,
  onToggleDark,
  running,
  onToggleRunning,
  onStep,
  speed,
  onSpeedChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onNew,
  onSaveClick,
  onOpenClick,
  onClear,
  onExport,
  onImport,
  onExamplesClick,
  onHelpClick,
  onAboutClick,
  onTruthTableClick,
  showWaveforms,
  onToggleWaveforms,
  onResetSim,
  showSignalLabels,
  onToggleSignalLabels,
  onImportExpr,
  onExportToPLC,
  onImportFromPLC,
}: Props) {
  const [editName, setEditName] = useState(circuitName);
  useEffect(() => setEditName(circuitName), [circuitName]);

  return (
    <header className="min-h-14 py-2 shrink-0 border-b border-indigo-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] bg-slate-950/80 backdrop-blur-md px-3 flex flex-wrap items-center gap-2.5 relative z-50">
      <div className="flex items-center gap-2.5 mr-1 shrink-0">
        <Logo size={28} />
        <div className="flex flex-col -space-y-0.5">
          <h1 className="font-semibold text-[15px] tracking-tight leading-none">
            Logic Lab
          </h1>
          <span className="text-[10px] text-muted-foreground tracking-wide">
            Digital Circuit Workbench
          </span>
        </div>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5" data-testid="button-file-menu">
            File <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onNew}>
            <FilePlus className="mr-2 h-4 w-4" />
            New circuit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenClick}>
            <Folder className="mr-2 h-4 w-4" />
            Open saved...
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onSaveClick}>
            <Save className="mr-2 h-4 w-4" />
            Save as...
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import JSON...
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onClear} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={onExamplesClick}
        data-testid="button-examples"
      >
        <Sparkles className="h-4 w-4 text-accent" />
        Examples
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={onTruthTableClick}
        data-testid="button-truth-table"
      >
        <Table2 className="h-4 w-4" />
        Truth Table
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={onImportExpr}
            data-testid="button-import-expr"
          >
            <FunctionSquare className="h-4 w-4 text-accent" />
            f(x) → Circuit
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import circuit from boolean expression</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      {/* Editable circuit name */}
      <div className="relative min-w-0 max-w-[260px] flex-shrink">
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={() => {
            const n = editName.trim() || "Untitled circuit";
            if (n !== circuitName) onCircuitNameChange(n);
            setEditName(n);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="h-8 pr-6 text-sm font-medium bg-transparent border-transparent hover:border-border focus:border-primary"
          data-testid="input-circuit-name"
        />
        {dirty && (
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-accent"
            title="Unsaved changes"
          />
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onUndo}
              disabled={!canUndo}
              data-testid="button-undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (⌘/Ctrl + Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRedo}
              disabled={!canRedo}
              data-testid="button-redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (⌘/Ctrl + Shift + Z)</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 min-w-0" />

      {/* Simulation controls */}
      <div className="flex items-center gap-1 px-1 py-1 rounded-md bg-muted/40 border border-border/60">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={running ? "default" : "ghost"}
              size="sm"
              onClick={onToggleRunning}
              className="gap-1.5 h-8"
              data-testid="button-toggle-running"
            >
              {running ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Running</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Paused</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{running ? "Pause clocks (Space)" : "Resume clocks (Space)"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onStep}
              data-testid="button-step"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Step one tick (.)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onResetSim}
              data-testid="button-reset-sim"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset latches & flip-flops</TooltipContent>
        </Tooltip>
      </div>

      {/* Speed slider */}
      <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md bg-muted/40 border border-border/60">
        <Zap className={`h-3.5 w-3.5 ${running ? "text-signal-high" : "text-muted-foreground"}`} />
        <Slider
          value={[speed]}
          onValueChange={([v]) => onSpeedChange(v)}
          min={0.25}
          max={4}
          step={0.25}
          className="w-24"
          data-testid="slider-speed"
        />
        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
          {speed.toFixed(2)}×
        </span>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showWaveforms ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={onToggleWaveforms}
            data-testid="button-waveforms"
          >
            <Activity className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Waveform timing panel</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showSignalLabels ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={onToggleSignalLabels}
            data-testid="button-signal-labels"
          >
            <Tag className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle signal labels on wires (0/1/X)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroup
            type="single"
            size="sm"
            value={symbolStyle}
            onValueChange={(v) => v && onSetSymbolStyle(v as SymbolStyle)}
            className="gap-0 border border-border rounded-md overflow-hidden"
          >
            <ToggleGroupItem
              value="ansi"
              className="px-3 py-1 h-8 rounded-none text-xs data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              data-testid="toggle-ansi"
            >
              ANSI
            </ToggleGroupItem>
            <ToggleGroupItem
              value="iec"
              className="px-3 py-1 h-8 rounded-none text-xs data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              data-testid="toggle-iec"
            >
              IEC
            </ToggleGroupItem>
          </ToggleGroup>
        </TooltipTrigger>
        <TooltipContent>
          <div className="font-medium mb-0.5">Symbol style</div>
          <div className="text-xs text-muted-foreground max-w-[220px] leading-snug">
            ANSI / IEEE 91 distinctive shapes, or rectangular IEC / IEEE 91
            qualifying labels.
          </div>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleDark}
            data-testid="button-toggle-theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle theme</TooltipContent>
      </Tooltip>

      {onExportToPLC && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40"
              onClick={onExportToPLC}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> → PLC
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export gates to PLC ladder logic</TooltipContent>
        </Tooltip>
      )}
      {onImportFromPLC && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40"
              onClick={onImportFromPLC}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> ← PLC
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import PLC ladder rungs as digital gates</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onHelpClick}
            data-testid="button-help"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Shortcuts &amp; help (?)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAboutClick}
            data-testid="button-about"
          >
            <Info className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>About Logic Lab</TooltipContent>
      </Tooltip>
    </header>
  );
}
