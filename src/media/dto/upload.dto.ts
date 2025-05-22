import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({
    description: 'Fichero a subir',
    format: 'binary',
    required: true,
  })
  file: Express.Multer.File;

  @IsOptional()
  @ApiProperty({
    description: 'El identificador único para el archivo multimedia',
    required: false,
  })
  mediaId?: string;

  @ApiProperty({
    description: 'Metadatos del archivo multimedia',
    type: Object,
  })
  metadata: any;
}
