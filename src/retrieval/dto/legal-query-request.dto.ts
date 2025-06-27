import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LLMConfig } from '../llm/llm.config';

export class LegalQueryRequestDto {
  @ApiProperty({
    description: 'Consulta legal que se desea realizar',
    example:
      '¿Cuáles son los requisitos para constituir una empresa en Paraguay?',
  })
  @IsNotEmpty()
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Proveedor de LLM a utilizar',
    example: 'openai',
    enum: ['openai', 'anthropic'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['openai', 'anthropic'])
  provider?: string;

  @ApiProperty({
    description: 'Modelo específico a utilizar',
    example: 'o4-mini',
    required: false,
  })
  @IsOptional()
  @IsString()
  model?: string;

  /**
   * Validación personalizada para verificar que el modelo sea válido para el proveedor
   */
  isValidModelForProvider(): boolean {
    if (!this.model || !this.provider) {
      return true; // Si no se especifica modelo o proveedor, usar defaults
    }
    return LLMConfig.isValidModel(this.provider, this.model);
  }
}
