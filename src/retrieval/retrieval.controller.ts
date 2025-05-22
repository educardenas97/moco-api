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
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
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
}
