import { IsString, IsObject, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RetrievalSetting {
  @ApiProperty()
  @IsNumber()
  top_k: number;

  @ApiProperty()
  @IsNumber()
  score_threshold: number;
}

export class RetrievalRequestDto {
  @ApiProperty()
  @IsString()
  knowledge_id: string;

  @ApiProperty()
  @IsString()
  query: string;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => RetrievalSetting)
  retrieval_setting: RetrievalSetting;
}
