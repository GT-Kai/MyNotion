CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  parent_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  remote_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_pages_workspace ON pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages(updated_at);

CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  parent_block_id TEXT,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  props TEXT NOT NULL, -- JSON string
  idx INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  remote_id TEXT,
  FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_parent ON blocks(parent_block_id);
CREATE INDEX IF NOT EXISTS idx_blocks_order ON blocks(page_id, parent_block_id, idx);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS page_tags (
  page_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (page_id, tag_id),
  FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_assets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_file_assets_workspace ON file_assets(workspace_id);
