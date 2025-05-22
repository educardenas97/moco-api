import { Test, TestingModule } from '@nestjs/testing';
import { RetrievalController } from './retrieval.controller';
import { RetrievalService } from './retrieval.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('RetrievalController', () => {
  let controller: RetrievalController;
  let service: RetrievalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetrievalController],
      providers: [
        {
          provide: RetrievalService,
          useValue: {
            retrieve: jest.fn().mockResolvedValue([
              {
                metadata: { path: 'path/to/doc', description: 'Descripción', context: {} },
                context: {},
                score: 0.9,
                title: 'test.pdf',
                content: 'Contenido de prueba',
              },
            ]),
            getOptions: jest.fn().mockResolvedValue({
              topics: ['Topic1', 'Topic2'],
              questions: ['FAQ1', 'FAQ2'],
            }),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<RetrievalController>(RetrievalController);
    service = module.get<RetrievalService>(RetrievalService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should retrieve documents', async () => {
    const result = await controller.getRetrieval({
      query: 'test query',
      knowledge_id: 'test',
      retrieval_setting: { top_k: 5, score_threshold: 0.5 },
    });

    expect(result).toBeDefined();
    expect(result.records).toBeDefined();
    expect(result.records.length).toBeGreaterThan(0);
    expect(service.retrieve).toHaveBeenCalled();
  });

  it('should get topics', async () => {
    const result = await controller.getTopics();

    expect(result).toBeDefined();
    expect(result.data).toHaveProperty('topics');
    expect(service.getOptions).toHaveBeenCalled();
  });
});
