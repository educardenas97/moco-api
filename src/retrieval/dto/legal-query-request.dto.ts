import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LegalQueryRequestDto {
  @ApiProperty({
    description: 'Consulta legal que se desea realizar',
    example: '¿Cuáles son los requisitos para constituir una empresa en Paraguay?',
  })
  @IsNotEmpty()
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Tipo específico de documentos a consultar (opcional)',
    example: 'leyes',
    required: false,
  })
  @IsOptional()
  @IsString()
  documentType?: string;
}
