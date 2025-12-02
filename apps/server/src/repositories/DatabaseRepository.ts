import { db } from '../db/sqlite';
import { Database, DatabaseColumn, DatabaseRow, DatabaseDetails } from '@my-notion/shared-types';
import { nanoid } from 'nanoid';

export class DatabaseRepository {
  // Create a new database with default columns
  createDatabase(pageId: string, title: string = 'Untitled Database'): Database {
    const id = nanoid();
    const now = new Date().toISOString();
    
    const createDbStmt = db.prepare(`
      INSERT INTO databases (id, page_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const createColStmt = db.prepare(`
      INSERT INTO database_columns (id, database_id, name, type, options, position)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const createRowStmt = db.prepare(`
      INSERT INTO database_rows (id, database_id, data, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      createDbStmt.run(id, pageId, title, now, now);
      
      // Default columns: Name (text), Tags (text/select - let's do text for MVP simplicity)
      const nameColId = nanoid();
      createColStmt.run(nameColId, id, 'Name', 'text', null, 0);
      
      const tagsColId = nanoid();
      createColStmt.run(tagsColId, id, 'Tags', 'text', null, 1);

      // Create 3 empty rows
      for (let i = 0; i < 3; i++) {
        const rowId = nanoid();
        createRowStmt.run(rowId, id, JSON.stringify({}), i, now, now);
      }
    });

    transaction();

    return {
      id,
      pageId,
      title,
      createdAt: now,
      updatedAt: now
    };
  }

  getDatabase(id: string): DatabaseDetails | null {
    const dbStmt = db.prepare('SELECT * FROM databases WHERE id = ?');
    const colsStmt = db.prepare('SELECT * FROM database_columns WHERE database_id = ? ORDER BY position ASC');
    const rowsStmt = db.prepare('SELECT * FROM database_rows WHERE database_id = ? ORDER BY position ASC');

    const database = dbStmt.get(id) as any;
    if (!database) return null;

    const columns = colsStmt.all(id) as any[];
    const rowsRaw = rowsStmt.all(id) as any[];

    // Transform rows data from string to object
    const rows: DatabaseRow[] = rowsRaw.map(r => ({
      id: r.id,
      databaseId: r.database_id,
      data: JSON.parse(r.data),
      position: r.position,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    // Transform columns
    const transformedCols: DatabaseColumn[] = columns.map(c => ({
      id: c.id,
      databaseId: c.database_id,
      name: c.name,
      type: c.type,
      options: c.options ? JSON.parse(c.options) : undefined,
      position: c.position
    }));

    return {
      database: {
        id: database.id,
        pageId: database.page_id,
        title: database.title,
        createdAt: database.created_at,
        updatedAt: database.updated_at
      },
      columns: transformedCols,
      rows
    };
  }

  createRow(databaseId: string): DatabaseRow {
    const id = nanoid();
    const now = new Date().toISOString();
    
    // Get max position
    const maxPosStmt = db.prepare('SELECT MAX(position) as maxPos FROM database_rows WHERE database_id = ?');
    const { maxPos } = maxPosStmt.get(databaseId) as any;
    const position = (maxPos || 0) + 1;

    const stmt = db.prepare(`
      INSERT INTO database_rows (id, database_id, data, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const data = {};
    stmt.run(id, databaseId, JSON.stringify(data), position, now, now);

    return {
      id,
      databaseId,
      data,
      position,
      createdAt: now,
      updatedAt: now
    };
  }

  updateRow(rowId: string, data: Record<string, any>): void {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE database_rows 
      SET data = ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(JSON.stringify(data), now, rowId);
  }

  deleteRow(rowId: string): void {
    const stmt = db.prepare('DELETE FROM database_rows WHERE id = ?');
    stmt.run(rowId);
  }

  createColumn(databaseId: string): DatabaseColumn {
    const id = nanoid();
    
    const maxPosStmt = db.prepare('SELECT MAX(position) as maxPos FROM database_columns WHERE database_id = ?');
    const { maxPos } = maxPosStmt.get(databaseId) as any;
    const position = (maxPos !== null ? maxPos : -1) + 1;

    const stmt = db.prepare(`
      INSERT INTO database_columns (id, database_id, name, type, options, position)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const name = 'New Column';
    const type = 'text';
    
    stmt.run(id, databaseId, name, type, null, position);

    return {
      id,
      databaseId,
      name,
      type,
      position
    };
  }

  updateColumn(id: string, name: string): void {
      const stmt = db.prepare('UPDATE database_columns SET name = ? WHERE id = ?');
      stmt.run(name, id);
  }
}
