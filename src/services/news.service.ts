import mongoose from 'mongoose';
import { News, INews } from '../models/news.model';
import { NewsInput, NewsUpdateInput, NewsQueryInput } from '../schemas/news.schema';

export class NewsService {
  // Criar nova notícia
  async createNews(newsData: NewsInput, authorId: string): Promise<INews> {
    try {
      const news = new News({
        ...newsData,
        author: new mongoose.Types.ObjectId(authorId),
        publishDate: newsData.publishDate || new Date()
      });

      await news.save();
      return news;
    } catch (error) {
      console.error('Erro no serviço ao criar notícia:', error);
      throw error;
    }
  }

  // Atualizar notícia existente
  async updateNews(id: string, updates: NewsUpdateInput): Promise<INews | null> {
    try {
      const updatedNews = await News.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );
      
      return updatedNews;
    } catch (error) {
      console.error('Erro no serviço ao atualizar notícia:', error);
      throw error;
    }
  }

  // Excluir notícia
  async deleteNews(id: string): Promise<boolean> {
    try {
      const result = await News.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Erro no serviço ao excluir notícia:', error);
      throw error;
    }
  }

  // Buscar notícia por ID
  async getNewsById(id: string): Promise<INews | null> {
    try {
      return await News.findById(id).populate('author', 'name');
    } catch (error) {
      console.error('Erro no serviço ao buscar notícia por ID:', error);
      throw error;
    }
  }

  // Listar notícias com paginação e filtros
  async getNewsList(query: NewsQueryInput, onlyPublished: boolean = true) {
    try {
      const { page = 1, limit = 10, tag, search } = query;
      
      // Construir filtros
      const filter: any = {};
      
      // Apenas notícias publicadas (para acesso público)
      if (onlyPublished) {
        filter.published = true;
      }
      
      // Filtrar por tag
      if (tag) {
        filter.tags = tag;
      }
      
      // Busca por texto
      if (search) {
        filter.$text = { $search: search };
      }

      // Calcular skip para paginação
      const skip = (page - 1) * limit;

      // Buscar notícias
      const news = await News.find(filter)
        .populate('author', 'name')
        .sort({ publishDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Contar total para paginação
      const total = await News.countDocuments(filter);

      return {
        news,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Erro no serviço ao listar notícias:', error);
      throw error;
    }
  }

  // Listar notícias de um autor específico
  async getNewsByAuthor(authorId: string, query: NewsQueryInput) {
    try {
      const { page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      // Filtrar por autor
      const filter = { author: new mongoose.Types.ObjectId(authorId) };

      // Buscar notícias do usuário
      const news = await News.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Contar total para paginação
      const total = await News.countDocuments(filter);

      return {
        news,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Erro no serviço ao listar notícias do autor:', error);
      throw error;
    }
  }

  // Verificar se usuário é autor da notícia
  async isAuthorOf(newsId: string, userId: string): Promise<boolean> {
    try {
      const news = await News.findById(newsId);
      if (!news) return false;
      
      return news.author.toString() === userId;
    } catch (error) {
      console.error('Erro ao verificar autoria da notícia:', error);
      return false;
    }
  }
}

// Exportar uma instância única do serviço
export const newsService = new NewsService();