import jwt from 'jsonwebtoken';
import { FastifyReply, FastifyRequest } from 'fastify';

// Interface para payload do token
export interface TokenPayload {
  _id: string;
  email: string;
  role: string;
}

// Gerar token JWT
export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  return jwt.sign(payload, secret, { expiresIn });
};

// Verificar token JWT
export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret) as TokenPayload;
};

// Extrair token do cabeçalho Authorization
export const extractTokenFromHeader = (request: FastifyRequest): string | null => {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
};

// Decodificar token sem verificar
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
};