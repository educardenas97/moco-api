export interface DocumentContentService {
  getDocumentText(
    filename: string,
    pageNumber: number,
  ): Promise<{
    text: string;
    metadata?: object;
  }>;

  getTopics(): Promise<string[]>;
  getFAQs(): Promise<string[]>;
}
