-- Expand project_kind enum to match app project types
ALTER TYPE public.project_kind ADD VALUE IF NOT EXISTS 'analog';
ALTER TYPE public.project_kind ADD VALUE IF NOT EXISTS 'plc';
ALTER TYPE public.project_kind ADD VALUE IF NOT EXISTS 'digital';
ALTER TYPE public.project_kind ADD VALUE IF NOT EXISTS 'pcb';
ALTER TYPE public.project_kind ADD VALUE IF NOT EXISTS 'engigraph';