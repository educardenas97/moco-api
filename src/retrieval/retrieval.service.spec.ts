import { Test, TestingModule } from '@nestjs/testing';
import { RetrievalService } from './retrieval.service';
import { EmbeddingServiceFactory } from './embedding/embedding-service.factory';
import { DocumentRetrievalServiceFactory } from './document-retrieval/document-retrieval-service.factory';
import { DocumentContentServiceFactory } from './document-content/document-content-service.factory';

describe('RetrievalService', () => {
  let service: RetrievalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetrievalService,
        {
          provide: EmbeddingServiceFactory,
          useValue: {
            createService: jest.fn().mockReturnValue({
              getEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
            }),
          },
        },
        {
          provide: DocumentRetrievalServiceFactory,
          useValue: {
            createService: jest.fn().mockReturnValue({
              findDocuments: jest.fn().mockResolvedValue([
                { filename: 'test.pdf', pageNumber: 1, score: 0.8 },
              ]),
            }),
          },
        },
        {
          provide: DocumentContentServiceFactory,
          useValue: {
            createService: jest.fn().mockReturnValue({
              getDocumentText: jest.fn().mockResolvedValue({
                text: 'Contenido de prueba',
                metadata: { topic: 'Test' },
              }),
              getTopics: jest.fn().mockResolvedValue(['Topic1', 'Topic2']),
              getFAQs: jest.fn().mockResolvedValue(['FAQ1', 'FAQ2']),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RetrievalService>(RetrievalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve documents', async () => {
    const result = await service.retrieve({
      query: 'test query',
      knowledge_id: 'test',
      retrieval_setting: { top_k: 5, score_threshold: 0.5 },
    });
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].content).toBe('Contenido de prueba');
  });

  it('should get options', async () => {
    const options = await service.getOptions();
    
    expect(options).toBeDefined();
    expect(options.topics).toEqual(['Topic1', 'Topic2']);
    expect(options.questions).toEqual(['FAQ1', 'FAQ2']);
  });
});
