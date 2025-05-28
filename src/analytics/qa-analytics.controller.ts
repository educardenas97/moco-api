import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { QAService } from '../providers/qa.service';
import { APIResponseDto } from '../classes';

@Controller('analytics/qa')
@ApiBearerAuth()
export class QAAnalyticsController {
  constructor(private readonly qaService: QAService) {}

  /**
   * Obtiene registros de consultas Q&A con filtros opcionales
   */
  @Get('records')
  @UseGuards(AuthGuard('bearer'))
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Obtiene registros de consultas Q&A',
    description: 'Recupera el historial de consultas realizadas con filtros opcionales'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados (default: 50)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Número de registros a omitir (default: 0)' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filtrar por ID de usuario' })
  @ApiQuery({ name: 'endpoint', required: false, type: String, description: 'Filtrar por endpoint' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Fecha de inicio (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Fecha de fin (ISO string)' })
  @ApiQuery({ name: 'searchQuery', required: false, type: String, description: 'Búsqueda de texto en consultas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros Q&A recuperados exitosamente',
  })
  async getQARecords(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('userId') userId?: string,
    @Query('endpoint') endpoint?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('searchQuery') searchQuery?: string,
  ): Promise<APIResponseDto> {
    try {
      const filters: any = {};
      
      if (userId) filters.userId = userId;
      if (endpoint) filters.endpoint = endpoint;
      if (dateFrom) filters.dateFrom = new Date(dateFrom);
      if (dateTo) filters.dateTo = new Date(dateTo);
      if (searchQuery) filters.searchQuery = searchQuery;

      const records = await this.qaService.getQARecords(filters, limit, skip);
      
      return new APIResponseDto({
        records,
        pagination: {
          limit,
          skip,
          total: records.length,
        },
      });
    } catch (error) {
      return new APIResponseDto({}, error);
    }
  }

  /**
   * Obtiene estadísticas agregadas de las consultas Q&A
   */
  @Get('stats')
  @UseGuards(AuthGuard('bearer'))
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Obtiene estadísticas de consultas Q&A',
    description: 'Recupera métricas agregadas sobre el uso del sistema de consultas'
  })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filtrar por ID de usuario' })
  @ApiQuery({ name: 'endpoint', required: false, type: String, description: 'Filtrar por endpoint' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Fecha de inicio (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Fecha de fin (ISO string)' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas recuperadas exitosamente',
  })
  async getQAStats(
    @Query('userId') userId?: string,
    @Query('endpoint') endpoint?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<APIResponseDto> {
    try {
      const filters: any = {};
      
      if (userId) filters.userId = userId;
      if (endpoint) filters.endpoint = endpoint;
      if (dateFrom) filters.dateFrom = new Date(dateFrom);
      if (dateTo) filters.dateTo = new Date(dateTo);

      const stats = await this.qaService.getQAStats(filters);
      
      return new APIResponseDto(stats);
    } catch (error) {
      return new APIResponseDto({}, error);
    }
  }

  /**
   * Limpia registros antiguos de Q&A
   */
  @Get('cleanup')
  @UseGuards(AuthGuard('bearer'))
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Limpia registros antiguos de Q&A',
    description: 'Elimina registros de consultas anteriores a la fecha especificada'
  })
  @ApiQuery({ 
    name: 'olderThanDays', 
    required: false, 
    type: Number, 
    description: 'Días de antigüedad para eliminar (default: 90)' 
  })
  @ApiResponse({
    status: 200,
    description: 'Limpieza completada exitosamente',
  })
  async cleanupOldRecords(
    @Query('olderThanDays', new DefaultValuePipe(90), ParseIntPipe) olderThanDays: number,
  ): Promise<APIResponseDto> {
    try {
      const deletedCount = await this.qaService.cleanupOldRecords(olderThanDays);
      
      return new APIResponseDto({
        message: `Se eliminaron ${deletedCount} registros antiguos`,
        deletedCount,
      });
    } catch (error) {
      return new APIResponseDto({}, error);
    }
  }
}
