import { FastifyRequest, FastifyReply } from 'fastify';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';

export const register = async (
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) => {
  try {
    const { name, email, password } = request.body;

    const result = await authService.registerUser({ name, email, password });

    return reply.status(201).send({
      user: {
        _id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      },
      token: result.token
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    if ((error as Error).message === 'Email já cadastrado') {
      return reply.status(400).send({ message: 'Email já cadastrado' });
    }
    return reply.status(500).send({ message: 'Erro ao registrar usuário' });
  }
};

export const login = async (
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) => {
  try {
    const { email, password } = request.body;

    const result = await authService.loginUser({ email, password });

    return reply.status(200).send({
      user: {
        _id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      },
      token: result.token
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    const errorMsg = (error as Error).message;
    
    if (errorMsg === 'Credenciais inválidas' || errorMsg === 'Usuário desativado') {
      return reply.status(401).send({ message: errorMsg });
    }
    
    return reply.status(500).send({ message: 'Erro ao fazer login' });
  }
};

export const getProfile = async (
  request: FastifyRequest & { user?: { _id: string } },
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    const user = await authService.getUserById(request.user._id);
    if (!user) {
      return reply.status(404).send({ message: 'Usuário não encontrado' });
    }

    return reply.status(200).send({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return reply.status(500).send({ message: 'Erro ao buscar perfil' });
  }
};

export const updateProfile = async (
  request: FastifyRequest<{ 
    Body: { 
      name?: string;
      email?: string;
    } 
  }> & { user?: { _id: string } },
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    const { name, email } = request.body;
    const userId = request.user._id;

    const updatedUser = await authService.updateUser(userId, { name, email });
    if (!updatedUser) {
      return reply.status(404).send({ message: 'Usuário não encontrado' });
    }

    return reply.status(200).send({
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return reply.status(500).send({ message: 'Erro ao atualizar perfil' });
  }
};

export const changePassword = async (
  request: FastifyRequest<{ 
    Body: { 
      currentPassword: string;
      newPassword: string;
    } 
  }> & { user?: { _id: string } },
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    const { currentPassword, newPassword } = request.body;
    const userId = request.user._id;

    await authService.updatePassword(userId, currentPassword, newPassword);

    return reply.status(200).send({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    
    const errorMsg = (error as Error).message;
    if (errorMsg === 'Senha atual incorreta') {
      return reply.status(400).send({ message: errorMsg });
    }
    
    return reply.status(500).send({ message: 'Erro ao alterar senha' });
  }
};

// Admin: Listar usuários
export const listUsers = async (
  request: FastifyRequest<{ 
    Querystring: { 
      page?: string;
      limit?: string;
    } 
  }> & { user?: { role: string } },
  reply: FastifyReply
) => {
  try {
    if (!request.user || request.user.role !== 'admin') {
      return reply.status(403).send({ message: 'Acesso restrito a administradores' });
    }

    const page = parseInt(request.query.page || '1');
    const limit = parseInt(request.query.limit || '10');

    const result = await authService.listUsers(page, limit);

    return reply.status(200).send(result);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return reply.status(500).send({ message: 'Erro ao listar usuários' });
  }
};