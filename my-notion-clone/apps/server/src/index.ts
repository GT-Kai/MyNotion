import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerPageRoutes } from './api/pages';
import { databaseRoutes } from './api/databases';
import path from 'path';

const server = Fastify({
  logger: true
});

server.register(cors, { 
  origin: true 
});

registerPageRoutes(server);
databaseRoutes(server);

server.get('/api/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
