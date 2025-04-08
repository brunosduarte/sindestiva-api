import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { connectDB } from './utils/mongodb.utils';
import authRoutes from './routes/auth.routes';
import newsRoutes from './routes/news.routes';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Criar aplicação Fastify
const app: FastifyInstance = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

// Registrar plugins
const startApp = async () => {
  try {
    // Configurar CORS
    await app.register(cors, {
      origin: true,
      credentials: true
    });

    // Configurar JWT
    await app.register(jwt, {
      secret: process.env.JWT_SECRET || 'segredo-super-secreto',
      sign: {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    });

    // Declarar o tipo customizado para o usuário JWT
    app.addHook('onRequest', async (request, reply) => {
      request.jwt = app.jwt;
    });

    // Configurar Swagger
    await app.register(swagger, {
      swagger: {
        info: {
          title: 'API Sindicato dos Estivadores de Rio Grande',
          description: 'API para gerenciamento de notícias e usuários',
          version: '1.0.0'
        },
        tags: [
          { name: 'auth', description: 'Rotas de autenticação' },
          { name: 'news', description: 'Rotas de notícias' }
        ],
        securityDefinitions: {
          bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        }
      }
    });

    await app.register(swaggerUi, {
      routePrefix: '/documentation'
    });

    // Conectar ao MongoDB
    await connectDB();

    // Registrar rotas
    app.register(authRoutes, { prefix: '/api/auth' });
    app.register(newsRoutes, { prefix: '/api/news' });

    // Rota de saúde
    app.get('/health', async (request, reply) => {
      return reply.send({ status: 'ok' });
    });

    // Tratamento de erros global
    app.setErrorHandler((error, request, reply) => {
      app.log.error(error);
      
      // Erros de validação Zod
      if (error.validation) {
        return reply.status(400).send({
          message: 'Erro de validação',
          errors: error.validation
        });
      }

      // Erros de JWT
      if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || 
          error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' ||
          error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        return reply.status(401).send({
          message: 'Não autorizado',
          error: error.message
        });
      }

      reply.status(500).send({
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error
      });
    });

    return app;
  } catch (error) {
    console.error('Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
};

export { app, startApp };