import { User, IUser } from '../models/user.model';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { generateToken } from '../utils/jwt.utils';
import bcrypt from 'bcrypt';

export class AuthService {
  // Registrar novo usuário
  async registerUser(userData: RegisterInput): Promise<{ user: IUser; token: string }> {
    try {
      // Verificar se email já existe
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('Email já cadastrado');
      }

      // Criar novo usuário
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: 'editor'  // Por padrão, novos usuários são editores
      });

      await user.save();

      // Gerar token JWT
      const token = generateToken({
        _id: user._id.toString(),
        email: user.email,
        role: user.role
      });

      return {
        user,
        token
      };
    } catch (error) {
      console.error('Erro no serviço ao registrar usuário:', error);
      throw error;
    }
  }

  // Fazer login
  async loginUser(credentials: LoginInput): Promise<{ user: IUser; token: string }> {
    try {
      // Buscar usuário pelo email
      const user = await User.findOne({ email: credentials.email });
      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar se o usuário está ativo
      if (!user.active) {
        throw new Error('Usuário desativado');
      }

      // Verificar senha
      const isMatch = await user.comparePassword(credentials.password);
      if (!isMatch) {
        throw new Error('Credenciais inválidas');
      }

      // Gerar token JWT
      const token = generateToken({
        _id: user._id.toString(),
        email: user.email,
        role: user.role
      });

      return {
        user,
        token
      };
    } catch (error) {
      console.error('Erro no serviço ao fazer login:', error);
      throw error;
    }
  }

  // Buscar usuário por ID
  async getUserById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id).select('-password');
    } catch (error) {
      console.error('Erro no serviço ao buscar usuário:', error);
      throw error;
    }
  }

  // Atualizar dados do usuário
  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    try {
      // Não permitir atualização de senha por este método
      if (userData.password) {
        delete userData.password;
      }

      return await User.findByIdAndUpdate(id, userData, { 
        new: true, 
        runValidators: true 
      }).select('-password');
    } catch (error) {
      console.error('Erro no serviço ao atualizar usuário:', error);
      throw error;
    }
  }

  // Atualizar senha
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw new Error('Senha atual incorreta');
      }

      // Criptografar e atualizar nova senha
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      return true;
    } catch (error) {
      console.error('Erro no serviço ao atualizar senha:', error);
      throw error;
    }
  }

  // Listar usuários (apenas para admin)
  async listUsers(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments();

      return {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Erro no serviço ao listar usuários:', error);
      throw error;
    }
  }
}

// Exportar uma instância única do serviço
export const authService = new AuthService();