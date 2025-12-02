import { FastifyInstance } from 'fastify';
import { DatabaseRepository } from '../repositories/DatabaseRepository';

export async function databaseRoutes(fastify: FastifyInstance) {
  const repo = new DatabaseRepository();

  // Create Database
  fastify.post<{ Body: { pageId: string; title?: string } }>(
    '/api/databases',
    async (request, reply) => {
      const { pageId, title } = request.body;
      const database = repo.createDatabase(pageId, title);
      return database;
    }
  );

  // Get Database Details
  fastify.get<{ Params: { id: string } }>(
    '/api/databases/:id',
    async (request, reply) => {
      const { id } = request.params;
      const details = repo.getDatabase(id);
      if (!details) {
        reply.status(404).send({ error: 'Database not found' });
        return;
      }
      return details;
    }
  );

  // Create Row
  fastify.post<{ Params: { id: string } }>(
    '/api/databases/:id/rows',
    async (request, reply) => {
      const { id } = request.params;
      const row = repo.createRow(id);
      return row;
    }
  );

  // Update Row
  fastify.patch<{ Params: { rowId: string }; Body: { data: Record<string, any> } }>(
    '/api/database-rows/:rowId',
    async (request, reply) => {
      const { rowId } = request.params;
      const { data } = request.body;
      repo.updateRow(rowId, data);
      return { success: true };
    }
  );

  // Delete Row
  fastify.delete<{ Params: { rowId: string } }>(
    '/api/database-rows/:rowId',
    async (request, reply) => {
      const { rowId } = request.params;
      repo.deleteRow(rowId);
      return { success: true };
    }
  );

  // Create Column
  fastify.post<{ Params: { id: string } }>(
    '/api/databases/:id/columns',
    async (request, reply) => {
      const { id } = request.params;
      const column = repo.createColumn(id);
      return column;
    }
  );

  // Update Column
  fastify.patch<{ Params: { colId: string }; Body: { name?: string; type?: string; position?: number } }>(
    '/api/database-columns/:colId',
    async (request, reply) => {
      const { colId } = request.params;
      const { name, type, position } = request.body;
      repo.updateColumn(colId, { name, type, position });
      return { success: true };
    }
  );
}
