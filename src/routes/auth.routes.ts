// src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { login, register, getProfile, updateProfile, changePassword, listUsers } from '../controllers/auth.controller';
import { authenticate, isAdmin } from '../middlewares/auth.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { zodToJsonSchema } from '../utils/schema.utils';

export default async function authRoutes(fastify: FastifyInstance) {
  // Registrar novo usuário
  fastify.post('/register', {
    schema: {
      body: zodToJsonSchema(registerSchema)
    },
    handler: register
  });

  // Login
  fastify.post('/login', {
    schema: {
      body: zodToJsonSchema(loginSchema)
    },
    handler: login
  });

  // Obter perfil do usuário autenticado
  fastify.get('/profile', {
    preHandler: [authenticate],
    handler: getProfile
  });

  // Atualizar perfil do usuário
  fastify.put('/profile', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 3 },
          email: { type: 'string', format: 'email' }
        }
      }
    },
    handler: updateProfile
  });

  // Alterar senha
  fastify.put('/change-password', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 6 },
          newPassword: { type: 'string', minLength: 6 }
        }
      }
    },
    handler: changePassword
  });

  // Listar usuários (admin)
  fastify.get('/users', {
    preHandler: [authenticate, isAdmin],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 }
        }
      }
    },
    handler: listUsers
  });
}