import { Injectable, Inject, Logger } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { QARecord, QASchema } from './schemas/qa.schema';
import { RetrievalResponseDto } from '../retrieval/dto/retrieval-response.dto';

export interface QARecordData {
  query: string;
  answer: string;
  sources: RetrievalResponseDto[];
  metadata: {
    responseTime: number;
    documentType?: string;
    userId?: string;
    endpoint: string;
  };
}

@Injectable()
export class QAService {
  private readonly logger = new Logger(QAService.name);
  private qaModel: Model<QARecord>;

  constructor(
    @Inject('MONGODB_CONNECTION')
    private readonly mongoConnection: typeof mongoose,
  ) {
    this.qaModel = this.mongoConnection.model<QARecord>('QA', QASchema);
  }

  /**
   * Registra una consulta Q&A en la base de datos
   * @param data Datos de la consulta Q&A
   * @returns Registro creado
   */
  async saveQARecord(data: QARecordData): Promise<QARecord> {
    try {
      const qaRecord = new this.qaModel({
        query: data.query,
        answer: data.answer,
        sources: data.sources.map(source => ({
          title: source.title,
          content: source.content,
          score: source.score,
        })),
        metadata: {
          ...data.metadata,
          timestamp: new Date(),
        },
      });

      const savedRecord = await qaRecord.save();
      
      this.logger.debug(`Registro Q&A guardado con ID: ${savedRecord._id}`);
      return savedRecord;
    } catch (error) {
      this.logger.error('Error al guardar el registro Q&A:', error);
      throw error;
    }
  }

  /**
   * Obtiene registros Q&A con filtros opcionales
   * @param filters Filtros de búsqueda
   * @param limit Límite de resultados
   * @param skip Número de registros a omitir
   * @returns Lista de registros Q&A
   */
  async getQARecords(
    filters: {
      userId?: string;
      endpoint?: string;
      dateFrom?: Date;
      dateTo?: Date;
      searchQuery?: string;
    } = {},
    limit: number = 50,
    skip: number = 0,
  ): Promise<QARecord[]> {
    try {
      const query: any = {};

      if (filters.userId) {
        query['metadata.userId'] = filters.userId;
      }

      if (filters.endpoint) {
        query['metadata.endpoint'] = filters.endpoint;
      }

      if (filters.dateFrom || filters.dateTo) {
        query['metadata.timestamp'] = {};
        if (filters.dateFrom) {
          query['metadata.timestamp'].$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query['metadata.timestamp'].$lte = filters.dateTo;
        }
      }

      if (filters.searchQuery) {
        query.$text = { $search: filters.searchQuery };
      }

      const records = await this.qaModel
        .find(query)
        .sort({ 'metadata.timestamp': -1 })
        .limit(limit)
        .skip(skip)
        .exec();

      this.logger.debug(`Recuperados ${records.length} registros Q&A`);
      return records;
    } catch (error) {
      this.logger.error('Error al obtener registros Q&A:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de las consultas Q&A
   * @param filters Filtros para las estadísticas
   * @returns Estadísticas agregadas
   */
  async getQAStats(filters: {
    userId?: string;
    endpoint?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<{
    totalQueries: number;
    averageResponseTime: number;
    topQueries: Array<{ query: string; count: number }>;
    querysByEndpoint: Array<{ endpoint: string; count: number }>;
  }> {
    try {
      const matchQuery: any = {};

      if (filters.userId) {
        matchQuery['metadata.userId'] = filters.userId;
      }

      if (filters.endpoint) {
        matchQuery['metadata.endpoint'] = filters.endpoint;
      }

      if (filters.dateFrom || filters.dateTo) {
        matchQuery['metadata.timestamp'] = {};
        if (filters.dateFrom) {
          matchQuery['metadata.timestamp'].$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          matchQuery['metadata.timestamp'].$lte = filters.dateTo;
        }
      }

      const [
        totalResult,
        avgResponseTimeResult,
        topQueriesResult,
        queriesByEndpointResult,
      ] = await Promise.all([
        // Total de consultas
        this.qaModel.countDocuments(matchQuery),

        // Tiempo promedio de respuesta
        this.qaModel.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: null,
              averageResponseTime: { $avg: '$metadata.responseTime' },
            },
          },
        ]),

        // Top consultas más frecuentes
        this.qaModel.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: '$query',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 0,
              query: '$_id',
              count: 1,
            },
          },
        ]),

        // Consultas por endpoint
        this.qaModel.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: '$metadata.endpoint',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          {
            $project: {
              _id: 0,
              endpoint: '$_id',
              count: 1,
            },
          },
        ]),
      ]);

      return {
        totalQueries: totalResult,
        averageResponseTime: avgResponseTimeResult[0]?.averageResponseTime || 0,
        topQueries: topQueriesResult,
        querysByEndpoint: queriesByEndpointResult,
      };
    } catch (error) {
      this.logger.error('Error al obtener estadísticas Q&A:', error);
      throw error;
    }
  }

  /**
   * Elimina registros Q&A antiguos
   * @param olderThanDays Días de antigüedad para eliminar
   * @returns Número de registros eliminados
   */
  async cleanupOldRecords(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deleteResult = await this.qaModel.deleteMany({
        'metadata.timestamp': { $lt: cutoffDate },
      });

      this.logger.log(`Eliminados ${deleteResult.deletedCount} registros Q&A antiguos`);
      return deleteResult.deletedCount;
    } catch (error) {
      this.logger.error('Error al limpiar registros Q&A antiguos:', error);
      throw error;
    }
  }
}
