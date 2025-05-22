import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { RetrievalRequestDto } from './dto/retrieval-request.dto';
import { RetrievalResponseDto } from './dto/retrieval-response.dto';
import { LegalQueryRequestDto } from './dto/legal-query-request.dto';
import { LegalQueryResponseDto } from './dto/legal-query-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { APIResponseDto } from '../classes';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('retrieval')
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
export class RetrievalController {
  constructor(private readonly retrievalService: RetrievalService) {}

  /**
   * Recurso designado para la recuperación de documentos desde dify
   * Es el único recurso que no cumple el estándar REST debido a la especificación de dify
   * @param retrievalRequestDto
   * @returns
   */
  @Post()
  @UseGuards(AuthGuard('bearer'))
  @HttpCode(200)
  async getRetrieval(
    @Body() retrievalRequestDto: RetrievalRequestDto,
  ): Promise<{ records: RetrievalResponseDto[] }> {
    try {
      const records = await this.retrievalService.retrieve(retrievalRequestDto);
      return {
        records,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Topicos que se pueden reponder con la recuperación de documentos
   * Se responde una lista de arreglos de strings
   */
  @Get('topics')
  @UseGuards(AuthGuard('bearer'))
  @HttpCode(200)
  async getTopics(): Promise<APIResponseDto> {
    try {
      const topics = await this.retrievalService.getOptions();
      return new APIResponseDto({
        topics,
      });
    } catch (error) {
      return new APIResponseDto({}, error);
    }
  }

  /**
   * Consulta legal que responde mediante un modelo de lenguaje utilizando
   * documentos legales como leyes, decretos y tratados
   * @param legalQueryRequestDto Consulta legal a realizar
   * @returns Respuesta generada y documentos fuente
   */
  @Post('legal-query')
  @UseGuards(AuthGuard('bearer'))
  @HttpCode(200)
  @ApiOperation({ summary: 'Realiza una consulta legal utilizando un LLM y documentos jurídicos' })
  @ApiResponse({
    status: 200,
    description: 'Respuesta generada y documentos relacionados',
    type: LegalQueryResponseDto,
  })
  async queryLegalDocuments(
    @Body() legalQueryRequestDto: LegalQueryRequestDto,
  ): Promise<APIResponseDto> {
    try {
      const result = await this.retrievalService.queryLegalDocuments(legalQueryRequestDto);
      return new APIResponseDto(result);
    } catch (error) {
      return new APIResponseDto({}, error);
    }
  }
}
