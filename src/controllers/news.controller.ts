import { FastifyRequest, FastifyReply } from 'fastify';
import { News } from '../models/news.model';
import { NewsInput, NewsQueryInput, NewsUpdateInput } from '../schemas/news.schema';
import mongoose from 'mongoose';

// Interface para request autenticada com user
interface AuthRequest extends FastifyRequest {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

// =================================================
// CONTROLADORES PARA ROTAS PROTEGIDAS (ADMIN)
// =================================================

// Criar nova notícia
export const createNews = async (
  request: AuthRequest & { Body: NewsInput },
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    const newsData = request.body;
    
    // Adicionar autor automaticamente
    const news = new News({
      ...newsData,
      author: new mongoose.Types.ObjectId(request.user._id),
      publishDate: newsData.publishDate || new Date()
    });

    await news.save();

    return reply.status(201).send(news);
  } catch (error) {
    console.error('Erro ao criar notícia:', error);
    return reply.status(500).send({ message: 'Erro ao criar notícia' });
  }
};

// Atualizar notícia
export const updateNews = async (
  request: AuthRequest & { 
    Params: { id: string };
    Body: NewsUpdateInput;
  },
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    const { id } = request.params;
    const updates = request.body;

    // Verificar se a notícia existe
    const news = await News.findById(id);
    if (!news) {
      return reply.status(404).send({ message: 'Notícia não encontrada' });
    }

    // Verificar permissões (apenas o autor ou admin pode editar)
    const isAuthor = news.author.toString() === request.user._id;
    const isAdmin = request.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      return reply.status(403).send({ message: 'Sem permissão para editar esta notícia' });
    }

    // Atualizar a notícia
    const updatedNews = await News.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return reply.status(200).send(updatedNews);
  } catch (error) {
    console.error('Erro ao atualizar notícia:', error);
    return reply.status(500).send({ message: 'Erro ao atualizar notícia' });
  }
};

// Deletar notícia
export const deleteNews = async (
  request: AuthRequest & { Params: { id: string } },
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    const { id } = request.params;

    // Verificar se a notícia existe
    const news = await News.findById(id);
    if (!news) {
      return reply.status(404).send({ message: 'Notícia não encontrada' });
    }

    // Verificar permissões (apenas o autor ou admin pode deletar)
    const isAuthor = news.author.toString() === request.user._id;
    const isAdmin = request.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      return reply.status(403).send({ message: 'Sem permissão para deletar esta notícia' });
    }

    await News.findByIdAndDelete(id);

    return reply.status(200).send({ message: 'Notícia deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar notícia:', error);
    return reply.status(500).send({ message: 'Erro ao deletar notícia' });
  }
};

// Listar notícias do usuário autenticado (incluindo não publicadas)
export const getMyNews = async (
  request: AuthRequest & { Querystring: NewsQueryInput },
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    const { page = 1, limit = 10, search, tag } = request.query;
    const skip = (page - 1) * limit;

    // Filtrar por autor
    const filter: any = { author: new mongoose.Types.ObjectId(request.user._id) };
    
    // Adicionar filtros adicionais se fornecidos
    if (tag) {
      filter.tags = tag;
    }
    
    if (search) {
      filter.$text = { $search: search };
    }

    // Buscar notícias do usuário
    const newsList = await News.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Contar total para paginação
    const total = await News.countDocuments(filter);

    return reply.status(200).send({
      news: newsList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar minhas notícias:', error);
    return reply.status(500).send({ message: 'Erro ao listar minhas notícias' });
  }
};

// =================================================
// CONTROLADORES PARA ROTAS PÚBLICAS
// =================================================

// Buscar notícia por ID (somente publicadas)
export const getNewsById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    const news = await News.findById(id).populate('author', 'name');
    if (!news) {
      return reply.status(404).send({ message: 'Notícia não encontrada' });
    }

    // Apenas notícias publicadas são visíveis publicamente
    if (!news.published) {
      return reply.status(404).send({ message: 'Notícia não encontrada' });
    }

    return reply.status(200).send(news);
  } catch (error) {
    console.error('Erro ao buscar notícia:', error);
    return reply.status(500).send({ message: 'Erro ao buscar notícia' });
  }
};

// Listar notícias com paginação e filtros (somente publicadas)
export const getNewsList = async (
  request: FastifyRequest<{ Querystring: NewsQueryInput }>,
  reply: FastifyReply
) => {
  try {
    const { page = 1, limit = 10, tag, search } = request.query;

    // Construir filtros - sempre mostrar apenas publicadas
    const filter: any = { published: true };
    
    // Adicionar filtros adicionais se fornecidos
    if (tag) {
      filter.tags = tag;
    }
    
    if (search) {
      filter.$text = { $search: search };
    }

    // Calcular skip para paginação
    const skip = (page - 1) * limit;

    // Buscar notícias
    const newsList = await News.find(filter)
      .populate('author', 'name')
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Contar total para paginação
    const total = await News.countDocuments(filter);

    return reply.status(200).send({
      news: newsList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar notícias:', error);
    return reply.status(500).send({ message: 'Erro ao listar notícias' });
  }
};