import mongoose from 'mongoose';
import { User, IUser } from '../models/user.model';
import { News } from '../models/news.model';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Carregar variáveis de ambiente
dotenv.config();

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/estivadores-rio-grande';
    await mongoose.connect(mongoUri);
    console.log('MongoDB conectado com sucesso');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Função para criar usuário administrador
const createAdminUser = async (): Promise<IUser | null> => {
  try {
    // Verificar se já existe um usuário admin
    const adminExists = await User.findOne({ email: 'admin@estivadoresriogrande.org.br' });
    
    if (adminExists) {
      console.log('Usuário administrador já existe');
      return adminExists;
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Criar usuário admin
    const admin = new User({
      name: 'Administrador',
      email: 'admin@estivadoresriogrande.org.br',
      password: hashedPassword,
      role: 'admin',
      active: true
    });

    await admin.save();
    console.log('Usuário administrador criado com sucesso');
    
    return admin;
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    throw error;
  }
};

// Função para criar notícias iniciais
const createSampleNews = async (authorId: mongoose.Types.ObjectId | string) => {
  try {
    // Verificar se já existem notícias
    const newsCount = await News.countDocuments();
    
    if (newsCount > 0) {
      console.log('Já existem notícias no sistema');
      return;
    }

    // Criar algumas notícias de exemplo
    const sampleNews = [
      {
        title: 'Assembleia Geral será realizada no próximo mês',
        content: '<p>O Sindicato dos Estivadores de Rio Grande convoca todos os associados para Assembleia Geral que será realizada no dia 15 do próximo mês, às 19h, na sede do sindicato.</p><p>Na pauta da reunião, serão discutidos temas importantes como as negociações salariais, benefícios e condições de trabalho.</p><p>É fundamental a presença de todos para fortalecer nossas reivindicações.</p>',
        summary: 'Reunião discutirá temas importantes para a categoria, como negociações salariais e condições de trabalho.',
        imageUrl: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21',
        published: true,
        publishDate: new Date(),
        tags: ['Assembleia', 'Comunicados'],
        author: authorId
      },
      {
        title: 'Novos cursos de capacitação disponíveis para associados',
        content: '<p>O Sindicato dos Estivadores de Rio Grande, em parceria com o SENAI, está oferecendo novos cursos de capacitação profissional para os associados e seus dependentes.</p><p>Entre os cursos disponíveis estão:</p><ul><li>Operação de Guindastes</li><li>NR-35 (Trabalho em Altura)</li><li>Movimentação de Cargas</li><li>Inglês Básico para Trabalho Portuário</li></ul><p>Os interessados devem se inscrever na secretaria do sindicato até o final deste mês.</p>',
        summary: 'Parceria com SENAI traz novas oportunidades de qualificação profissional para associados e dependentes.',
        imageUrl: 'https://images.unsplash.com/photo-1501516069922-a9982bd6f3bd',
        published: true,
        publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 dias atrás
        tags: ['Educação', 'Cursos', 'Benefícios'],
        author: authorId
      },
      {
        title: 'Campanha de vacinação contra a gripe começa na próxima semana',
        content: '<p>A partir da próxima segunda-feira, o Sindicato dos Estivadores de Rio Grande, em parceria com a Secretaria Municipal de Saúde, irá promover uma campanha de vacinação contra a gripe.</p><p>A vacinação acontecerá na sede do sindicato, das 9h às 17h, de segunda a sexta-feira, durante duas semanas.</p><p>Para receber a vacina, os associados devem apresentar a carteira do sindicato e documento de identidade. Os dependentes devem estar acompanhados do titular.</p><p>A vacina é gratuita e de extrema importância para a prevenção de doenças respiratórias, especialmente para quem trabalha em ambiente portuário.</p>',
        summary: 'Parceria com a Secretaria de Saúde proporcionará vacinas gratuitas para associados e dependentes na sede do sindicato.',
        imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982',
        published: true,
        publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 dias atrás
        tags: ['Saúde', 'Benefícios'],
        author: authorId
      }
    ];

    await News.insertMany(sampleNews);
    console.log('Notícias de exemplo criadas com sucesso');
  } catch (error) {
    console.error('Erro ao criar notícias de exemplo:', error);
    throw error;
  }
};

// Função principal para executar o seed
const seed = async () => {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Criar usuário administrador
    const admin = await createAdminUser();
    
    // Se criou admin, criar notícias
    if (admin) {
      await createSampleNews(admin._id as mongoose.Types.ObjectId);
    }
    
    console.log('Seed concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o seed:', error);
  } finally {
    // Desconectar do banco de dados
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
};

// Executar o seed
seed();