import { z } from 'zod';

export const newsSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  summary: z.string().min(5, 'Resumo deve ter pelo menos 5 caracteres'),
  imageUrl: z.string().url('URL da imagem inválida').optional(),
  published: z.boolean().default(true),
  publishDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional()
});

export const newsUpdateSchema = newsSchema.partial();

export const newsQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '10')),
  tag: z.string().optional(),
  search: z.string().optional()
});

export type NewsInput = z.infer<typeof newsSchema>;
export type NewsUpdateInput = z.infer<typeof newsUpdateSchema>;
export type NewsQueryInput = z.infer<typeof newsQuerySchema>;