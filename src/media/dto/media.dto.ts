import { ApiResponseProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsNumber } from 'class-validator';

export class MediaDto {
  @IsString()
  @ApiResponseProperty()
  name: string;

  @IsNumber()
  @ApiResponseProperty()
  size: number;

  @IsOptional()
  @ApiResponseProperty()
  @IsObject()
  metadata: any;
}
