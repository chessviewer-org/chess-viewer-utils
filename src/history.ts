// Types
export type HistorySource = 'manual' | 'export' | 'drag';
export type ArchiveSource = 'auto' | 'manual';
export type FreshnessStatus = 'green' | 'yellow' | 'red';

export interface BaseHistoryEntry {
  id: number;
  fen: string;
  createdAt: number;
  lastActiveAt: number;
  source: HistorySource;
  isFavorite: boolean;
}

export interface ActiveHistoryEntry extends BaseHistoryEntry {
  dragSessionId?: string;
}

export interface ArchivedHistoryEntry extends BaseHistoryEntry {
  archivedAt: number;
  archiveSource: ArchiveSource;
}

export interface HistoryFilters {
  fenSearch?: string;
  dateFrom?: number;
  dateTo?: number;
  status?: FreshnessStatus;
  source?: HistorySource;
  favoritesOnly?: boolean;
}

// Constants
const DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * DAY_MS;
const THIRTY_DAYS_MS = 30 * DAY_MS;
const NINETY_DAYS_MS = 90 * DAY_MS;

export function calculateStatus(lastActiveAt: number): FreshnessStatus {
  const age = Date.now() - lastActiveAt;
  if (age < SEVEN_DAYS_MS) return 'green';
  if (age < THIRTY_DAYS_MS) return 'yellow';
  return 'red';
}

export function createHistoryEntry(
  fen: string,
  source: HistorySource,
  dragSessionId: string | null = null
): ActiveHistoryEntry {
  const now = Date.now();
  return {
    id: now,
    fen,
    createdAt: now,
    lastActiveAt: now,
    source,
    isFavorite: false,
    ...(dragSessionId ? { dragSessionId } : {}),
  };
}

export function touchEntry<T extends BaseHistoryEntry>(entry: T): T {
  return { ...entry, lastActiveAt: Date.now() };
}

export function sortByMostRecent<T extends { lastActiveAt: number }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.lastActiveAt - a.lastActiveAt);
}

export function sortArchivedByArchiveDate(entries: ArchivedHistoryEntry[]): ArchivedHistoryEntry[] {
  return [...entries].sort((a, b) => b.archivedAt - a.archivedAt);
}

export function mergeById<T extends { id: number }>(primary: T[], secondary: T[]): T[] {
  const byId = new Map<number, T>();
  for (const entry of secondary) byId.set(entry.id, entry);
  for (const entry of primary) byId.set(entry.id, entry);
  return [...byId.values()];
}

export function applyFilters<T extends BaseHistoryEntry>(entries: T[], filters: HistoryFilters): T[] {
  if (!filters || Object.keys(filters).length === 0) return entries;
  return entries.filter((entry) => {
    if (filters.fenSearch && !entry.fen.toLowerCase().includes(filters.fenSearch.toLowerCase())) return false;
    if (filters.dateFrom && entry.createdAt < filters.dateFrom) return false;
    if (filters.dateTo && entry.createdAt > filters.dateTo) return false;
    if (filters.status && calculateStatus(entry.lastActiveAt) !== filters.status) return false;
    if (filters.source && entry.source !== filters.source) return false;
    if (filters.favoritesOnly && !entry.isFavorite) return false;
    return true;
  });
}

export interface PartitionResult {
  active: ActiveHistoryEntry[];
  toArchive: ActiveHistoryEntry[];
}

export function partitionByArchiveStatus(entries: ActiveHistoryEntry[]): PartitionResult {
  const active: ActiveHistoryEntry[] = [];
  const toArchive: ActiveHistoryEntry[] = [];
  for (const entry of entries) {
    if (entry.isFavorite || Date.now() - entry.lastActiveAt < NINETY_DAYS_MS) {
      active.push(entry);
    } else {
      toArchive.push(entry);
    }
  }
  return { active, toArchive };
}

export function convertToArchivedEntry(
  entry: ActiveHistoryEntry,
  archiveSource: ArchiveSource = 'auto'
): ArchivedHistoryEntry {
  return {
    id: entry.id,
    fen: entry.fen,
    createdAt: entry.createdAt,
    lastActiveAt: entry.lastActiveAt,
    archivedAt: Date.now(),
    source: entry.source,
    archiveSource,
    isFavorite: entry.isFavorite,
  };
}
