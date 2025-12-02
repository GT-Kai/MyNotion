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
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'todo'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image';

export interface Block {
  id: string;
  pageId: string;
  parentBlockId?: string | null;
  type: BlockType;
  content: string;
  props: Record<string, any>;
  index: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  remoteId?: string | null;
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
