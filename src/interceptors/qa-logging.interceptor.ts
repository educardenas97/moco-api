import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { QAService } from '../providers/qa.service';
import { RetrievalRequestDto } from '../retrieval/dto/retrieval-request.dto';
import { LegalQueryRequestDto } from '../retrieval/dto/legal-query-request.dto';

@Injectable()
export class QALoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(QALoggingInterceptor.name);

  constructor(private readonly qaService: QAService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    // Solo interceptar endpoints de consulta
    const shouldLog = this.shouldLogEndpoint(className, methodName);
    
    if (!shouldLog) {
      return next.handle();
    }

    const startTime = Date.now();
    const endpoint = `${className}.${methodName}`;

    return next.handle().pipe(
      tap(async (data) => {
        try {
          const responseTime = Date.now() - startTime;
          await this.logQAInteraction(
            request,
            data,
            endpoint,
            responseTime,
          );
        } catch (error) {
          this.logger.error('Error al registrar interacción Q&A:', error);
        }
      }),
    );
  }

  private shouldLogEndpoint(className: string, methodName: string): boolean {
    // Solo registrar endpoints de consulta Q&A
    return (
      className === 'RetrievalController' &&
      (methodName === 'queryLegalDocuments' || methodName === 'getRetrieval')
    );
  }

  private async logQAInteraction(
    request: any,
    responseData: any,
    endpoint: string,
    responseTime: number,
  ): Promise<void> {
    try {
      const body = request.body;
      let query: string = '';
      let answer: string = '';
      let sources: any[] = [];
      let documentType: string | undefined;

      // Extraer datos según el tipo de endpoint
      if (endpoint.includes('queryLegalDocuments')) {
        const requestDto = body as LegalQueryRequestDto;
        query = requestDto.query;
        documentType = requestDto.documentType;
        
        if (responseData && responseData.data) {
          answer = responseData.data.answer || '';
          sources = responseData.data.sources || [];
        }
      } else if (endpoint.includes('getRetrieval')) {
        const requestDto = body as RetrievalRequestDto;
        query = requestDto.query;
        
        if (responseData && responseData.records) {
          // Para el endpoint de retrieval, la "respuesta" son los documentos recuperados
          answer = `Se recuperaron ${responseData.records.length} documentos relevantes`;
          sources = responseData.records || [];
        }
      }

      // Solo registrar si tenemos datos válidos
      if (query && (answer || sources.length > 0)) {
        await this.qaService.saveQARecord({
          query,
          answer,
          sources,
          metadata: {
            responseTime,
            documentType,
            userId: this.extractUserId(request),
            endpoint: endpoint.replace('Controller.', '/'),
          },
        });

        this.logger.debug(`Interacción Q&A registrada: ${query.substring(0, 50)}...`);
      }
    } catch (error) {
      this.logger.error('Error interno al procesar interacción Q&A:', error);
    }
  }

  private extractUserId(request: any): string | undefined {
    // Intentar extraer el ID de usuario del token o headers
    // Esto dependerá de cómo esté implementada la autenticación
    return request.user?.id || request.headers?.['user-id'] || undefined;
  }
}
