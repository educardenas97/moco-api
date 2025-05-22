import { Injectable, Logger } from '@nestjs/common';
import { DocumentRetrievalService } from './document-retrieval-service.interface';
import { RetrievalSetting } from '../dto/retrieval-request.dto';
import { v1 } from '@google-cloud/aiplatform';

@Injectable()
export class VertexAiMatchingEngineRetrievalService
  implements DocumentRetrievalService
{
  private readonly logger = new Logger(
    VertexAiMatchingEngineRetrievalService.name,
  );
  private matchServiceClient: v1.MatchServiceClient;

  constructor() {
    this.matchServiceClient = new v1.MatchServiceClient({
      projectId: process.env.GCP_PROJECT_ID,
      credentials:
        process.env.GOOGLE_CREDENTIALS_PATH !== undefined
          ? process.env.GOOGLE_CREDENTIALS_PATH
          : JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}'),
      apiEndpoint: process.env.GOOGLE_VERTEXAI_API_ENDPOINT,
    });
  }

  async findDocuments(
    embedding: number[],
    retrievalSetting: RetrievalSetting,
  ): Promise<{ filename: string; pageNumber: number; score?: number }[]> {
    const indexEndpointId: string =
      process.env.GOOGLE_VERTEXAI_MATCHINGENGINE_INDEXENDPOINT || '';
    const deployedIndexId: string =
      process.env.GOOGLE_VERTEXAI_MATCHINGENGINE_INDEX || '';

    const numNeighbors = retrievalSetting.top_k;
    const scoreThreshold = retrievalSetting.score_threshold;

    try {
      const request: any = {
        indexEndpoint: indexEndpointId,
        deployedIndexId: deployedIndexId,
        queries: [
          {
            datapoint: {
              featureVector: embedding,
            },
            filter: {
              // TODO: Verificar si el filtro se aplica de esta manera, la doc no es clara
              threshold: scoreThreshold,
            },
            neighborCount: numNeighbors,
          },
        ],
        returnFullDatapoint: false,
      };

      this.logger.debug(
        `Consultando a vertex search al siguiente index endpoint: ${indexEndpointId}`,
      );

      const response = await this.matchServiceClient.findNeighbors(request);

      this.logger.debug(
        `Respuesta de Vertex Search: ${JSON.stringify(response[0])}`, // response[0] contiene la respuesta real
      );

      const nearestNeighbors = response[0]?.nearestNeighbors?.[0];
      if (!nearestNeighbors) {
        throw new Error('No neighbors found in the response');
      }
      const points = nearestNeighbors.neighbors; // Ajusta la forma de acceder a los neighbors

      if (points) {
        this.logger.debug(`Puntos encontrados: ${points.length}`);
      } else {
        this.logger.debug('No se encontraron puntos.');
      }

      if (!points) {
        return [];
      }
      return points
        .sort((a: any, b: any) => a.distance - b.distance)
        .map((point: any) => {
          const [filename, pageNumberStr] = point.datapoint.datapointId.split(
            ':',
            2,
          );
          return {
            filename,
            pageNumber: parseInt(pageNumberStr, 10),
            score: point.distance,
          };
        });
    } catch (error) {
      this.logger.error('Error al consultar el Matching Engine', error.message);
      throw error;
    }
  }
}
