import { ApiProperty } from '@nestjs/swagger';
import { RetrievalResponseDto } from './retrieval-response.dto';

export class LegalQueryResponseDto {
  @ApiProperty({
    description: 'Respuesta generada por el modelo de lenguaje',
  })
  answer: string;

  @ApiProperty({
    description: 'Documentos recuperados que respaldan la respuesta',
    type: [RetrievalResponseDto],
  })
  sources: RetrievalResponseDto[];
}
