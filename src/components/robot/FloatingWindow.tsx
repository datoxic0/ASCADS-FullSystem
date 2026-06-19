import React, { useState, useEffect, useRef } from "react";
import { X, Maximize2, Minimize2, Move } from "lucide-react";

interface FloatingWindowProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onFocus: () => void;
  zIndex: number;
  title: string;
  icon?: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultX?: number;
  defaultY?: number;
  minWidth?: number;
  minHeight?: number;
  children: React.ReactNode;
}

export default function FloatingWindow({
  id,
  isOpen,
  onClose,
  onFocus,
  zIndex,
  title,
  icon,
  defaultWidth = 650,
  defaultHeight = 480,
  defaultX = 100,
  defaultY = 100,
  minWidth = 320,
  minHeight = 220,
  children,
}: FloatingWindowProps) {
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Drag and resize tracking refs
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; objX: number; objY: number } | null>(null);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; startWidth: number; startHeight: number } | null>(null);

  // Check mobile scale
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle Dragging
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (isMaximized || isMobile) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;

    e.preventDefault();
    onFocus(); // Bring to front
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      objX: position.x,
      objY: position.y,
    };

    document.addEventListener("mousemove", handleHeaderMouseMove);
    document.addEventListener("mouseup", handleHeaderMouseUp);
  };

  const handleHeaderMouseMove = (e: MouseEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Allow window to be dragged partially off-screen but keep header grabbable
    const nextX = Math.max(-size.width + 50, Math.min(screenWidth - 50, dragStartRef.current.objX + dx));
    const nextY = Math.max(0, Math.min(screenHeight - 50, dragStartRef.current.objY + dy));

    setPosition({ x: nextX, y: nextY });
  };

  const handleHeaderMouseUp = () => {
    dragStartRef.current = null;
    document.removeEventListener("mousemove", handleHeaderMouseMove);
    document.removeEventListener("mouseup", handleHeaderMouseUp);
  };

  // Handle Resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (isMaximized || isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus(); // Bring to front

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };

    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!resizeStartRef.current) return;
    const dx = e.clientX - resizeStartRef.current.mouseX;
    const dy = e.clientY - resizeStartRef.current.mouseY;

    const nextWidth = Math.max(minWidth, resizeStartRef.current.startWidth + dx);
    const nextHeight = Math.max(minHeight, resizeStartRef.current.startHeight + dy);

    setSize({ width: nextWidth, height: nextHeight });
  };

  const handleResizeMouseUp = () => {
    resizeStartRef.current = null;
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);
  };

  const handleHeaderDoubleSelect = (e: React.MouseEvent) => {
    if (isMobile) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    setIsMaximized(!isMaximized);
    onFocus();
  };

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[110] p-4">
        <div className="bg-[#16161a] border border-white/10 rounded-t-xl sm:rounded-lg w-full max-h-[85vh] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-150">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 shrink-0 bg-[#0f0f12] rounded-t-xl sm:rounded-t-lg">
            <div className="flex items-center space-x-2">
              {icon && <span className="text-blue-500">{icon}</span>}
              <span className="font-mono text-xs font-semibold text-slate-200 uppercase tracking-wide">{title}</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-1 rounded-full hover:bg-white/5 cursor-pointer transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-0 overflow-hidden flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </div>
    );
  }

  const modalStyle: React.CSSProperties = isMaximized
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex,
      }
    : {
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex,
      };

  return (
    <div
      style={modalStyle}
      onClick={onFocus}
      className="bg-[#16161a] border border-white/10 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col select-none transition-shadow animate-in fade-in zoom-in duration-150"
    >
      <div
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={handleHeaderDoubleSelect}
        style={{ cursor: isMaximized ? "default" : "move" }}
        className="flex items-center justify-between px-4 py-2 border-b border-white/5 shrink-0 bg-[#0f0f12] rounded-t-lg select-none"
      >
        <div className="flex items-center space-x-2">
          {icon && <span className="text-blue-500">{icon}</span>}
          <span className="font-mono text-[10px] font-semibold text-slate-200 uppercase tracking-widest flex items-center space-x-1">
            <span>{title}</span>
            {!isMaximized && <Move className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5" />}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); onFocus(); }}
            className="text-slate-400 hover:text-slate-200 p-1 hover:bg-white/5 rounded transition-colors cursor-pointer"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-slate-400 hover:text-slate-200 p-1 hover:bg-white/5 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="p-0 overflow-hidden flex-1 flex flex-col relative bg-[#0a0a0c]">
        {children}
      </div>
      {!isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          style={{ cursor: "se-resize" }}
          className="absolute bottom-0 right-0 w-5 h-5 flex items-end justify-end p-0.5 select-none z-20 group"
        >
          <svg className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
            <line x1="14" y1="21" x2="21" y2="14" />
            <line x1="18" y1="21" x2="21" y2="18" />
          </svg>
        </div>
      )}
    </div>
  );
}
