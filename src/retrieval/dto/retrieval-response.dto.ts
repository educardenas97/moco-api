import { IsString, IsObject, IsNumber, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RetrievalResponseDto {
  @ApiProperty()
  @IsNumber()
  score: number;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Número de página del documento',
  })
  @IsNumber()
  pageNumber: number;
}
