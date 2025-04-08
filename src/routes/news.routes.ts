// src/routes/news.routes.ts
import { FastifyInstance } from 'fastify';
import { 
  createNews, 
  updateNews, 
  deleteNews, 
  getNewsById, 
  getNewsList,
  getMyNews
} from '../controllers/news.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { newsSchema, newsUpdateSchema, newsQuerySchema } from '../schemas/news.schema';
import { zodToJsonSchema } from '../utils/schema.utils';

export default async function newsRoutes(fastify: FastifyInstance) {
  // Rotas públicas
  
  // Listar notícias (com paginação e filtros)
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
          tag: { type: 'string' },
          search: { type: 'string' }
        }
      }
    },
    handler: getNewsList
  });

  // Obter notícia por ID
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: getNewsById
  });

  // Rotas protegidas (requerem autenticação)

  // Criar nova notícia
  fastify.post('/', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['title', 'content', 'summary'],
        properties: {
          title: { type: 'string', minLength: 3 },
          content: { type: 'string', minLength: 10 },
          summary: { type: 'string', minLength: 5 },
          imageUrl: { type: 'string' },
          published: { type: 'boolean', default: true },
          publishDate: { type: 'string' },
          tags: { 
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    handler: createNews
  });

  // Atualizar notícia
  fastify.put('/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 3 },
          content: { type: 'string', minLength: 10 },
          summary: { type: 'string', minLength: 5 },
          imageUrl: { type: 'string' },
          published: { type: 'boolean' },
          publishDate: { type: 'string' },
          tags: { 
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    handler: updateNews
  });

  // Deletar notícia
  fastify.delete('/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: deleteNews
  });

  // Listar minhas notícias
  fastify.get('/my', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
          tag: { type: 'string' },
          search: { type: 'string' }
        }
      }
    },
    handler: getMyNews
  });
}