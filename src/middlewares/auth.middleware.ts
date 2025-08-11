import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.model';
import { verifyToken } from '../utils/jwt.utils';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

// Middleware para verificar autenticação
export const authenticate = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    // Verificar a presença do cabeçalho de autorização
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ 
        message: 'Acesso restrito. Faça login para continuar.', 
        code: 'UNAUTHORIZED'
      });
    }

    // Extrair o token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ 
        message: 'Token de autenticação inválido',
        code: 'INVALID_TOKEN'
      });
    }

    // Verificar e decodificar o token
    try {
      const decoded = verifyToken(token);
      
      // Verificar se o usuário existe e está ativo
      const user = await User.findById(decoded._id);
      if (!user || !user.active) {
        return reply.status(401).send({ 
          message: 'Usuário não encontrado ou inativo',
          code: 'USER_INVALID'
        });
      }

      // Adicionar informações do usuário à requisição
      request.user = {
        _id: user._id.toString(),
        email: user.email,
        role: user.role
      };

    } catch (tokenError) {
      // Token expirado ou inválido
      return reply.status(401).send({ 
        message: 'Sessão expirada. Faça login novamente.',
        code: 'TOKEN_EXPIRED'
      });
    }

  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return reply.status(500).send({ 
      message: 'Erro interno do servidor',
      code: 'SERVER_ERROR'
    });
  }
};

// Middleware para verificar se o usuário é administrador
export const isAdmin = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ 
        message: 'Usuário não autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    if (request.user.role !== 'admin') {
      return reply.status(403).send({ 
        message: 'Acesso restrito a administradores',
        code: 'FORBIDDEN'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar permissões de administrador:', error);
    return reply.status(500).send({ 
      message: 'Erro interno do servidor',
      code: 'SERVER_ERROR'
    });
  }
};

// Middleware para verificar se o usuário é editor ou administrador
export const isEditorOrAdmin = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ 
        message: 'Usuário não autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    // Verificar se o usuário tem permissões de editor ou admin
    if (!['editor', 'admin'].includes(request.user.role)) {
      return reply.status(403).send({ 
        message: 'Acesso restrito a editores e administradores',
        code: 'FORBIDDEN'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar permissões de editor/admin:', error);
    return reply.status(500).send({ 
      message: 'Erro interno do servidor',
      code: 'SERVER_ERROR'
    });
  }
};