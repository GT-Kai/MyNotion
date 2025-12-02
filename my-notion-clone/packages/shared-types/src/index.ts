export type PageType = 'note' | 'project' | 'daily' | 'collection';

export interface Page {
  id: string;
  workspaceId: string;
  title: string;
  type: PageType;
  icon?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isArchived: boolean; // 0 or 1 in DB, boolean here
  createdAt: string; // ISO
  updatedAt: string; // ISO
  version: number;
  remoteId?: string | null;
}

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bulletList'
  | 'orderedList'
  | 'quote'
  | 'code'
  | 'divider'
  | 'table';

export interface Block {
  id: string;
  pageId: string;
  type: BlockType;
  content: string; // For 'table', this will store the databaseId
  props: Record<string, any>;
  index: number;
  parentBlockId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  remoteId?: string | null;
}

// --- Database Types ---

export interface Database {
  id: string;
  pageId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type ColumnType = 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'checkbox' | 'url' | 'email';

export interface DatabaseColumn {
  id: string;
  databaseId: string;
  name: string;
  type: ColumnType;
  options?: string[]; // For select/multi-select (JSON string or array depending on context, let's say string[] for frontend)
  position: number;
}

export interface DatabaseRow {
  id: string;
  databaseId: string;
  data: Record<string, any>; // Key is columnId, Value is cell content
  position: number;
  createdAt: string;
  updatedAt: string;
}

// API Responses
export interface DatabaseDetails {
  database: Database;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
}

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color?: string | null;
}

export interface FileAsset {
  id: string;
  workspaceId: string;
  fileName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  createdAt: string;
}
