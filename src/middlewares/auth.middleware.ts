import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.model';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    // Verificar o token usando o plugin @fastify/jwt
    await request.jwtVerify();

    // O JWT verificado é automaticamente decodificado e disponível como request.user
    const userId = request.user?._id;

    // Verificar se o usuário existe e está ativo
    const user = await User.findById(userId);
    if (!user || !user.active) {
      return reply.status(401).send({ message: 'Usuário não encontrado ou inativo' });
    }

    // Adicionar informações do usuário à requisição
    request.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role
    };

  } catch (error) {
    return reply.status(401).send({ message: 'Token inválido ou expirado' });
  }
};

export const isAdmin = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    if (request.user.role !== 'admin') {
      return reply.status(403).send({ message: 'Acesso restrito a administradores' });
    }
  } catch (error) {
    return reply.status(500).send({ message: 'Erro ao verificar permissões' });
  }
};