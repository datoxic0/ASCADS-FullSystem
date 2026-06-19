import { useMemo, useState } from "react";
import { GATE_CATEGORIES, defaultGate, sizeOf } from "@/lib/component-defs";
import type { GateKind, SymbolStyle } from "@/lib/types";
import { GateBody } from "./GateBody";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Search, X, ChevronDown } from "lucide-react";

type Props = {
  style: SymbolStyle;
  onClickPlace?: (kind: GateKind) => void;
  activeKind?: GateKind | null;
};

export function Palette({ style, onClickPlace, activeKind }: Props) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return GATE_CATEGORIES;
    return GATE_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.kind.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [q]);

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-sidebar/80 backdrop-blur-sm flex flex-col">
      <div className="px-3 py-3 border-b border-border space-y-2">
        <div>
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Components
          </h2>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            Drag onto the workspace
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-7 pl-7 pr-7 text-xs"
            data-testid="palette-search"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded hover-elevate text-muted-foreground"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-4">
        {filtered.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-6">
            No components match “{query}”.
          </div>
        )}
        {filtered.map((cat) => {
          const isCollapsed = collapsed[cat.label] && !q;
          return (
            <div key={cat.label}>
              <button
                type="button"
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [cat.label]: !c[cat.label] }))
                }
                className="w-full flex items-center justify-between px-1 mb-1.5 group"
                aria-expanded={!isCollapsed}
              >
                <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                  {cat.label}
                </h3>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-muted-foreground/60 transition-transform",
                    isCollapsed && "-rotate-90",
                  )}
                />
              </button>
              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-2">
                  {cat.items.map((item) => (
                    <PaletteItem
                      key={item.kind}
                      kind={item.kind}
                      name={item.name}
                      style={style}
                      active={activeKind === item.kind}
                      onClickPlace={onClickPlace}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground/70 leading-snug">
        Click a tile to arm placement, then click on the canvas. Drag to drop.
      </div>
    </aside>
  );
}

function PaletteItem({
  kind,
  name,
  style,
  active,
  onClickPlace,
}: {
  kind: GateKind;
  name: string;
  style: SymbolStyle;
  active?: boolean;
  onClickPlace?: (kind: GateKind) => void;
}) {
  const previewGate = {
    id: "preview",
    ...defaultGate(kind, 0, 0),
  };
  const { w, h } = sizeOf(previewGate);
  const padX = 12;
  const padY = 14;
  const vbW = w + padX * 2;
  const vbH = h + padY * 2;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/x-logic-lab-gate", kind);
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => onClickPlace?.(kind)}
          className={cn(
            "group relative flex flex-col items-center justify-center rounded-md border bg-card/60 hover-elevate active-elevate-2 cursor-grab active:cursor-grabbing px-2 pt-2 pb-1 select-none transition-colors",
            active
              ? "border-primary/70 ring-1 ring-primary/30"
              : "border-card-border",
          )}
          data-testid={`palette-${kind}`}
        >
          <svg
            viewBox={`${-padX} ${-padY} ${vbW} ${vbH}`}
            className="w-full h-12 text-foreground"
            preserveAspectRatio="xMidYMid meet"
          >
            <GateBody
              gate={previewGate as any}
              style={style}
              signals={[]}
              preview
            />
          </svg>
          <span className="text-[10.5px] font-medium text-foreground/85 mt-0.5">
            {name}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground mt-0.5 max-w-[220px]">
          Drag to place. Click to arm placement.
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
