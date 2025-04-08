import mongoose, { Document, Schema } from 'mongoose';

export interface INews extends Document {
  title: string;
  content: string;
  summary: string;
  imageUrl?: string;
  published: boolean;
  publishDate: Date;
  tags: string[];
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String
    },
    published: {
      type: Boolean,
      default: true
    },
    publishDate: {
      type: Date,
      default: Date.now
    },
    tags: [{
      type: String,
      trim: true
    }],
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// Índice para pesquisa por texto
newsSchema.index({ title: 'text', content: 'text', summary: 'text' });

export const News = mongoose.model<INews>('News', newsSchema);