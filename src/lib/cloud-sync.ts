import { supabase } from "@/integrations/supabase/client";
import type { AnalogProject } from "./analog-types";
import type { Database } from "@/integrations/supabase/types";

type Kind = Database["public"]["Enums"]["project_kind"];

const KIND_MAP: Record<string, Kind> = {
  analog: "analog",
  plc: "plc",
  digital: "digital",
  robot: "robot",
  pcb: "pcb",
  engigraph: "engigraph",
};

function toKind(t: string | undefined): Kind {
  return (t && KIND_MAP[t]) || "analog";
}

/** Fetch all projects owned by the current user, hydrated with their latest document. */
export async function fetchCloudProjects(userId: string): Promise<AnalogProject[]> {
  const { data: rows, error } = await supabase
    .from("projects")
    .select("id, name, kind, created_at, updated_at, description")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const { data: docs, error: docErr } = await supabase
    .from("project_documents")
    .select("project_id, document, version")
    .in("project_id", ids)
    .order("version", { ascending: false });
  if (docErr) throw docErr;

  const latestByProject = new Map<string, any>();
  docs?.forEach((d) => {
    if (!latestByProject.has(d.project_id)) latestByProject.set(d.project_id, d.document);
  });

  return rows.map((r) => {
    const doc = latestByProject.get(r.id) as Partial<AnalogProject> | undefined;
    return {
      id: r.id,
      name: r.name,
      type: (doc?.type as AnalogProject["type"]) ?? (r.kind as any) ?? "analog",
      data: doc?.data ?? null,
      linkedProjects: doc?.linkedProjects ?? [],
      sheets: doc?.sheets ?? [],
      activeSheetId: doc?.activeSheetId ?? "",
      history: doc?.history ?? [],
      createdAt: doc?.createdAt ?? new Date(r.created_at).getTime(),
      updatedAt: doc?.updatedAt ?? new Date(r.updated_at).getTime(),
    } as AnalogProject;
  });
}

/** Upsert a single project (row + new document version) for the current user. */
export async function pushCloudProject(userId: string, p: AnalogProject): Promise<void> {
  const kind = toKind(p.type);

  // Upsert row
  const { error: upErr } = await supabase.from("projects").upsert(
    {
      id: p.id.length === 36 ? p.id : undefined, // let DB assign if not a UUID
      owner_id: userId,
      name: p.name,
      kind,
      updated_at: new Date(p.updatedAt || Date.now()).toISOString(),
    },
    { onConflict: "id" },
  );
  if (upErr) throw upErr;

  // Resolve real DB id (in case DB assigned one)
  const { data: row } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", userId)
    .eq("name", p.name)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const projectId = row?.id;
  if (!projectId) return;

  // Next version
  const { data: last } = await supabase
    .from("project_documents")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (last?.version ?? 0) + 1;

  const { error: docErr } = await supabase.from("project_documents").insert({
    project_id: projectId,
    version,
    document: p as any,
    created_by: userId,
    message: `autosave v${version}`,
  });
  if (docErr) throw docErr;
}

export async function deleteCloudProject(userId: string, projectId: string): Promise<void> {
  if (projectId.length !== 36) return; // local-only id
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("owner_id", userId);
  if (error) throw error;
}
