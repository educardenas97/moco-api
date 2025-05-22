import { RetrievalSetting } from '../dto/retrieval-request.dto';

export interface DocumentRetrievalService {
  findDocuments(
    embedding: number[],
    retrievalSetting: RetrievalSetting,
  ): Promise<{ filename: string; pageNumber: number; score?: number }[]>;
}
