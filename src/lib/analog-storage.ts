import type { AnalogProject, Sheet, Commit } from './analog-types';

const STORAGE_KEY = 'ascads_projects_v2';
const ACTIVE_KEY = 'ascads_active_v2';

function generateId() {
  return Math.random().toString(36).substring(2, 12);
}

function generateHash() {
  return Math.random().toString(16).substring(2, 8);
}

function sanitizeHandleIds(edges: any[]): any[] {
  return edges.map(e => ({
    ...e,
    sourceHandle: e.sourceHandle ? e.sourceHandle.replace(/-t$/, '') : e.sourceHandle,
    targetHandle: e.targetHandle ? e.targetHandle.replace(/-t$/, '') : e.targetHandle,
  }));
}

function migrateProjects(projects: AnalogProject[]): AnalogProject[] {
  return projects.map(p => ({
    ...p,
    sheets: p.sheets.map(s => ({
      ...s,
      edges: sanitizeHandleIds(s.edges),
    })),
  }));
}

export function loadProjects(): AnalogProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return migrateProjects(parsed);
  } catch {
    return [];
  }
}

export function saveProjects(projects: AnalogProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function createProject(name: string): AnalogProject {
  const defaultSheet: Sheet = {
    id: generateId(),
    name: 'Sheet_1',
    nodes: [],
    edges: [],
  };
  const initCommit: Commit = {
    id: generateId(),
    hash: generateHash(),
    author: 'user',
    message: 'Initial commit',
    timestamp: Date.now(),
  };
  return {
    id: generateId(),
    name,
    sheets: [defaultSheet],
    activeSheetId: defaultSheet.id,
    history: [initCommit],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function upsertProject(projects: AnalogProject[], project: AnalogProject): AnalogProject[] {
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    const updated = [...projects];
    updated[idx] = { ...project, updatedAt: Date.now() };
    return updated;
  }
  return [...projects, project];
}

export function deleteProject(projects: AnalogProject[], id: string): AnalogProject[] {
  return projects.filter(p => p.id !== id);
}

export function addCommit(project: AnalogProject, message: string): AnalogProject {
  const commit: Commit = {
    id: generateId(),
    hash: generateHash(),
    author: 'user',
    message,
    timestamp: Date.now(),
  };
  return { ...project, history: [commit, ...project.history] };
}

export function setActiveProject(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}
