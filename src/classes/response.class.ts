import { IsObject, ValidateNested, IsOptional } from 'class-validator';
import { APIErrorDto } from './error.class';

export class APIResponseDto {
  @IsObject()
  data: any;

  @IsOptional()
  error: APIErrorDto | null = null;

  constructor(data: any, error: APIErrorDto | null = null) {
    this.data = data;
    this.error = error;
  }
}
