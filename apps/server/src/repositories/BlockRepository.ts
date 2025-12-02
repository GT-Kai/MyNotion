import { db } from '../db/sqlite';
import { Block } from '@my-notion/shared-types';

export class BlockRepository {
  static findByPageId(pageId: string): Block[] {
    const stmt = db.prepare('SELECT * FROM blocks WHERE page_id = ? ORDER BY idx ASC');
    const rows = stmt.all(pageId) as any[];
    return rows.map(row => ({
      ...row,
      pageId: row.page_id,
      parentBlockId: row.parent_block_id,
      props: JSON.parse(row.props || '{}'),
      index: row.idx,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      remoteId: row.remote_id,
    }));
  }

  static replaceAllForPage(pageId: string, blocks: Block[]): void {
    const deleteStmt = db.prepare('DELETE FROM blocks WHERE page_id = ?');
    const insertStmt = db.prepare(`
      INSERT INTO blocks (
        id, page_id, parent_block_id, type, content, props,
        idx, created_at, updated_at, version, remote_id
      ) VALUES (
        @id, @pageId, @parentBlockId, @type, @content, @props,
        @index, @createdAt, @updatedAt, @version, @remoteId
      )
    `);

    const insertMany = db.transaction((items: Block[]) => {
      deleteStmt.run(pageId);
      for (const block of items) {
        insertStmt.run({
          id: block.id,
          pageId: block.pageId,
          parentBlockId: block.parentBlockId,
          type: block.type,
          content: block.content,
          props: JSON.stringify(block.props),
          index: block.index,
          createdAt: block.createdAt,
          updatedAt: block.updatedAt,
          version: block.version,
          remoteId: block.remoteId
        });
      }
    });

    insertMany(blocks);
  }

  static findBlocksLinkingToPage(pageId: string): { pageId: string; pageTitle: string; blockId: string; content: string; }[] {
    const likePattern = `%[[page:${pageId}|%`;
    
    const stmt = db.prepare(`
      SELECT 
        b.id as blockId,
        b.content as content,
        p.id as pageId,
        p.title as pageTitle
      FROM blocks b
      JOIN pages p ON p.id = b.page_id
      WHERE b.content LIKE ?
    `);
    
    return stmt.all(likePattern) as any[];
  }
}
