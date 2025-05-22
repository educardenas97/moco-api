export interface EmbeddingService {
  getEmbedding(text: string): Promise<number[]>;
}
