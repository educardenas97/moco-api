import { Inject, Injectable, Logger } from '@nestjs/common';
import { DocumentContentService } from './document-content-service.interface';

@Injectable()
export class RedisDocumentContentService implements DocumentContentService {
  private readonly logger = new Logger(RedisDocumentContentService.name);

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: any,
  ) {}

  /**
   * Método para obtener el texto de un documento almacenado en Redis
   */
  async getDocumentText(
    filename: string,
    pageNumber: number,
  ): Promise<{
    text: string;
    metadata?: object;
  }> {
    try {
      this.logger.debug(
        `Obteniendo documento ${filename}:${pageNumber} desde Redis`,
      );

      // Verificamos si existe la clave y la obtenemos en un solo paso
      const jsonString = await this.redisClient.get(`document:${filename}`);

      if (!jsonString) {
        this.logger.warn(`Documento ${filename} no encontrado`);
        return { text: '', metadata: {} };
      }

      return this.extractDocumentContent(jsonString, filename, pageNumber);
    } catch (error) {
      this.logger.error(
        `Error al obtener el documento ${filename} desde Redis: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Método auxiliar para extraer el contenido del documento de una cadena JSON
   */
  private extractDocumentContent(
    jsonString: string,
    filename: string,
    pageNumber: number,
  ): { text: string; metadata?: object } {
    try {
      const doc = JSON.parse(jsonString);

      // Validar que el documento tenga la estructura esperada
      if (!Array.isArray(doc.pages)) {
        this.logger.warn(
          `El documento ${filename} no contiene un array de páginas válido`,
        );
        return { text: '', metadata: doc.metadata || {} };
      }

      // Validar que el número de página sea válido
      if (pageNumber < 0 || pageNumber >= doc.pages.length) {
        this.logger.warn(
          `Página ${pageNumber} fuera de rango para documento ${filename}`,
        );
        return { text: '', metadata: doc.metadata || {} };
      }

      // Devolver el texto de la página y los metadatos
      return {
        text: doc.pages[pageNumber],
        metadata: doc.metadata || {},
      };
    } catch (error) {
      this.logger.error(`Error al procesar el documento ${filename}`, error);
      return { text: '', metadata: {} };
    }
  }

  /**
   * Método para obtener los tópicos almacenados en Redis
   */
  async getTopics(): Promise<string[]> {
    return this.scanAndCollect('topics:*', (value) => {
      const { topics } = JSON.parse(value);
      return Array.isArray(topics) ? topics : [];
    });
  }

  /**
   * Método para obtener las FAQs almacenadas en Redis
   */
  async getFAQs(): Promise<string[]> {
    return this.scanAndCollect('questions:*', (value) => {
      const { questions } = JSON.parse(value);
      return Array.isArray(questions) ? questions : [];
    });
  }

  /**
   * Método auxiliar para escanear Redis y recolectar valores únicos
   */
  private async scanAndCollect(
    pattern: string,
    extractItems: (value: string) => string[],
  ): Promise<string[]> {
    const uniqueItems = new Set<string>();
    let cursor = 0;

    try {
      this.logger.debug(`Escaneando claves con patrón: ${pattern}`);

      do {
        // Escanear claves que coincidan con el patrón
        const { cursor: nextCursor, keys } = await this.redisClient.scan(
          cursor,
          {
            MATCH: pattern,
            COUNT: 100,
          },
        );

        cursor = nextCursor;

        if (keys.length === 0) continue;

        // Obtener valores y procesarlos
        const values = await this.redisClient.mGet(keys);

        values.filter(Boolean).forEach((value) => {
          try {
            extractItems(value)
              .filter((item) => typeof item === 'string')
              .forEach((item) => uniqueItems.add(item));
          } catch (e) {
            this.logger.warn(
              `Error al procesar el valor ${value}: ${e.message}`,
            );
          }
        });
      } while (cursor !== 0);

      const result = Array.from(uniqueItems);
      this.logger.debug(`Encontrados ${result.length} elementos únicos`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error al escanear claves con patrón ${pattern}`,
        error,
      );
      throw error;
    }
  }
}
