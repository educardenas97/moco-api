import { ApiResponseProperty } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  ValidateNested,
  IsOptional,
} from 'class-validator';

export class APIErrorDto {
  @IsString()
  @ApiResponseProperty()
  code: string;

  @ApiResponseProperty()
  @IsString()
  message: string;

  @ApiResponseProperty()
  @IsOptional()
  extension: any;
}
