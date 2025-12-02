import { db } from '../db/sqlite';
import { Page } from '@my-notion/shared-types';

export class PageRepository {
  static findAll(): Page[] {
    // Convert is_archived from 0/1 to boolean
    const stmt = db.prepare('SELECT * FROM pages WHERE is_archived = 0 ORDER BY sort_order DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      isArchived: !!row.is_archived,
      // map snake_case to camelCase if needed, but usually better-sqlite3 returns column names.
      // Wait, my schema uses snake_case (workspace_id) but my interface uses camelCase (workspaceId).
      // I need to map them.
      workspaceId: row.workspace_id,
      parentId: row.parent_id,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      remoteId: row.remote_id,
      is_archived: undefined, workspace_id: undefined, parent_id: undefined, sort_order: undefined, created_at: undefined, updated_at: undefined, remote_id: undefined
    }));
  }

  static findById(id: string): Page | undefined {
    const stmt = db.prepare('SELECT * FROM pages WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      isArchived: !!row.is_archived,
      workspaceId: row.workspace_id,
      parentId: row.parent_id,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      remoteId: row.remote_id,
    } as Page;
  }

  static create(page: Page): void {
    const stmt = db.prepare(`
      INSERT INTO pages (
        id, workspace_id, title, type, icon, parent_id,
        sort_order, is_archived, created_at, updated_at,
        version, remote_id
      ) VALUES (
        @id, @workspaceId, @title, @type, @icon, @parentId,
        @sortOrder, @isArchived, @createdAt, @updatedAt,
        @version, @remoteId
      )
    `);
    
    // Need to transform boolean/camelCase back to snake_case/integers for DB
    const params = {
      id: page.id,
      workspaceId: page.workspaceId,
      title: page.title,
      type: page.type,
      icon: page.icon,
      parentId: page.parentId,
      sortOrder: page.sortOrder,
      isArchived: page.isArchived ? 1 : 0,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      version: page.version,
      remoteId: page.remoteId
    };
    
    stmt.run(params);
  }

  static update(id: string, updates: Partial<Page>): void {
    const fields: string[] = [];
    const params: any = { id };

    if (updates.title !== undefined) {
      fields.push('title = @title');
      params.title = updates.title;
    }
    if (updates.parentId !== undefined) {
      fields.push('parent_id = @parentId');
      params.parentId = updates.parentId;
    }
    if (updates.updatedAt !== undefined) {
      fields.push('updated_at = @updatedAt');
      params.updatedAt = updates.updatedAt;
    }

    if (fields.length === 0) return;

    const sql = `UPDATE pages SET ${fields.join(', ')} WHERE id = @id`;
    const stmt = db.prepare(sql);
    stmt.run(params);
  }
}
