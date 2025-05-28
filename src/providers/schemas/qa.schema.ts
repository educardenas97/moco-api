import { Schema, Document } from 'mongoose';

export interface QARecord extends Document {
  query: string;
  answer: string;
  sources: Array<{
    title: string;
    content: string;
    score: number;
    metadata: any;
  }>;
  metadata: {
    responseTime: number;
    timestamp: Date;
    documentType?: string;
    userId?: string;
    endpoint: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const QASchema = new Schema({
  query: {
    type: String,
    required: true,
    index: true,
  },
  answer: {
    type: String,
    required: true,
  },
  sources: [{
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  }],
  metadata: {
    responseTime: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    documentType: {
      type: String,
      required: false,
    },
    userId: {
      type: String,
      required: false,
    },
    endpoint: {
      type: String,
      required: true,
    },
  },
}, {
  timestamps: true,
  collection: 'Q&A',
});

// Indexes for better performance
QASchema.index({ 'metadata.timestamp': -1 });
QASchema.index({ query: 'text' });
QASchema.index({ 'metadata.endpoint': 1 });
QASchema.index({ 'metadata.userId': 1 });
