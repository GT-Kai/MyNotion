import { FastifyInstance } from 'fastify';
import { PageRepository } from '../repositories/PageRepository';
import { BlockRepository } from '../repositories/BlockRepository';
import { nanoid } from 'nanoid';
import { Page, Block } from '@my-notion/shared-types';

export async function registerPageRoutes(app: FastifyInstance) {
  app.get('/api/pages', async () => {
    return PageRepository.findAll();
  });

  app.post('/api/pages', async (request) => {
    const body = request.body as { title?: string; type?: any; parentId?: string | null };

    const now = new Date().toISOString();
    const page: Page = {
      id: nanoid(),
      workspaceId: 'default',
      title: body.title || 'Untitled',
      type: body.type || 'note',
      icon: null,
      parentId: body.parentId ?? null,
      sortOrder: Date.now(),
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      version: 1,
      remoteId: null,
    };

    PageRepository.create(page);
    return page;
  });
  
  app.get('/api/pages/:id', async (req, reply) => {
      const { id } = req.params as { id: string };
      const page = PageRepository.findById(id);
      if (!page) {
          return reply.status(404).send({ error: 'Page not found' });
      }
      const blocks = BlockRepository.findByPageId(id);
      return { page, blocks };
  });

  app.patch('/api/pages/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<Page>;
    
    const existing = PageRepository.findById(id);
    if (!existing) {
        return reply.status(404).send({ error: 'Page not found' });
    }

    PageRepository.update(id, {
        ...body,
        updatedAt: new Date().toISOString()
    });

    return { success: true };
  });

  app.get('/api/pages/:id/backlinks', async (req, reply) => {
    const { id } = req.params as { id: string };

    const raw = BlockRepository.findBlocksLinkingToPage(id);

    // Filter with regex to be safe and extract cleaner preview if needed
    const pattern = new RegExp(`\\[\\[page:${id}\\|([^\\]]+)\\]\\]`);

    const backlinks = raw
      .filter(row => pattern.test(row.content))
      .map(row => ({
        pageId: row.pageId,
        pageTitle: row.pageTitle,
        blockId: row.blockId,
        preview: row.content.slice(0, 200), // Simple truncation
      }));

    return { backlinks };
  });

  app.put('/api/pages/:id/blocks', async (req, reply) => {
    const { id } = req.params as { id: string };
    const blocks = req.body as Block[];
    
    BlockRepository.replaceAllForPage(id, blocks);
    return { success: true };
  });
}
