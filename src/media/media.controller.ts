import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  ServiceUnavailableException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StorageFile } from '../storage/storage.file';
import { StorageService } from 'src/storage/storage.service';
import { Logger } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { APIErrorDto, APIResponseDto } from 'src/classes';
import { MediaDto, UploadMediaDto } from './dto';

const generateUniqueId = require('generate-unique-id');

@Controller('media')
@ApiInternalServerErrorResponse({
  description: 'Error interno',
  type: APIErrorDto,
})
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  constructor(private storageService: StorageService) {}

  /**
   * Sube un archivo multimedia.
   *
   * @param file - El archivo subido.
   * @param mediaId - El identificador único para el archivo multimedia. Por defecto es un ID único generado.
   * @param res - El objeto de respuesta.
   *
   * @returns Un objeto JSON que contiene el mediaId, fileName, contentType y fileSize.
   *
   * @throws ServiceUnavailableException - Si hay un error interno al guardar el archivo.
   */
  @Post()
  @ApiCreatedResponse({
    description: 'Fichero subido correctamente',
    type: MediaDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        files: 1,
        fileSize: 1024 * 1024,
      },
    }),
  )
  async uploadMedia(
    @UploadedFile()
    file: Express.Multer.File,
    @Body()
    uploadMediaDto: UploadMediaDto,
  ): Promise<APIResponseDto> {
    try {
      const { metadata } = uploadMediaDto;
      const mediaId =
        uploadMediaDto.mediaId || generateUniqueId({ length: 20 });

      file.originalname = Buffer.from(file.originalname, 'binary').toString(
        'utf-8',
      );
      // Verifica que la metadata sea un JSON válido y contenga el campo "accesos"
      if (metadata && typeof metadata === 'string') {
        try {
          if (!JSON.parse(metadata)?.accesos) {
            throw new Error('El campo "accesos" es obligatorio');
          }
        } catch (error) {
          return new APIResponseDto(false, {
            code: 'UPLOAD_MEDIA_ERROR',
            message: 'Error al parsear la metadata',
            extension: error,
          });
        }
      }

      this.logger.debug(`Guardando fichero con id: ${mediaId}`);
      const storageResponse = await this.storageService.save(
        file.originalname,
        file.mimetype,
        file.buffer,
        [
          {
            fileName: file.originalname,
            contentType: file.mimetype,
            fileSize: file.size.toString(),
            id: mediaId,
            metadata: JSON.stringify(JSON.parse(metadata)),
          },
        ],
      );
      if (!storageResponse.success) {
        throw new ServiceUnavailableException('error interno');
      }
      this.logger.debug(`fichero con id ${mediaId} guardada`);

      return new APIResponseDto({
        mediaId,
        fileName: file.originalname,
        contentType: file.mimetype,
        fileSize: file.size.toString(),
        metadata,
      });
    } catch (error) {
      this.logger.error(`Error al guardar la fichero: ${error}`);
      return new APIResponseDto(false, {
        code: 'UPLOAD_MEDIA_ERROR',
        message: 'Error al guardar la fichero',
        extension: error,
      });
    }
  }

  /**
   * Descarga un archivo multimedia.
   *
   * @param mediaId - El identificador único para el archivo multimedia.
   * @param res - El objeto de respuesta.
   *
   * @throws NotFoundException - Si el archivo no se encuentra.
   * @throws ServiceUnavailableException - Si hay un error interno al descargar el archivo
   */
  @Get('/:mediaId')
  async downloadMedia(@Param('mediaId') mediaId: string, @Res() res: Response) {
    let storageFile: StorageFile;
    try {
      this.logger.debug(`Buscando fichero con id: ${mediaId}`);
      storageFile = await this.storageService.getWithMetaData(
        'media/' + mediaId,
      );
      this.logger.debug(`fichero encontrado con id: ${mediaId}`);
    } catch (e) {
      if (e.message.toString().includes('No such object')) {
        this.logger.debug(`fichero ${mediaId} no encontrado en el storage`);
        throw new NotFoundException('fichero no encontrado');
      } else {
        throw new ServiceUnavailableException('error interno');
      }
    }

    const contentType = storageFile?.contentType || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'max-age=60d');
    res.end(storageFile.buffer);
  }

  /**
   * Lista los archivos multimedia.
   */
  @Get()
  @ApiOkResponse({
    description: 'Ficheros listados correctamente',
    type: [MediaDto],
  })
  async listMedia(): Promise<APIResponseDto> {
    this.logger.debug('Listando ficheros disponibles');
    try {
      const files = await this.storageService.listFiles('');
      this.logger.debug('Ficheros listados correctamente');
      return new APIResponseDto(files);
    } catch (error) {
      return new APIResponseDto(false, {
        code: 'LIST_MEDIA_ERROR',
        message: 'Error al listar los ficheros',
        extension: error,
      });
    }
  }

  /**
   * Recurso para eliminar un archivo multimedia.
   * @param mediaId - El identificador único para el archivo multimedia.
   * @returns Un objeto JSON que contiene el mediaId.
   */
  @Delete('/:mediaId')
  @ApiOkResponse({
    description: 'Fichero eliminado correctamente',
    type: MediaDto,
  })
  async deleteMedia(
    @Param('mediaId') mediaId: string,
  ): Promise<APIResponseDto> {
    this.logger.debug(`Eliminando fichero con id: ${mediaId}`);
    try {
      const response = await this.storageService.delete(mediaId);
      if (!response) {
        throw new NotFoundException('fichero no encontrado');
      }
      this.logger.debug(`Fichero con id ${mediaId} eliminado`);
      return new APIResponseDto({ mediaId });
    } catch (error) {
      return new APIResponseDto(false, {
        code: 'DELETE_MEDIA_ERROR',
        message: 'Error al eliminar el fichero',
        extension: error,
      });
    }
  }

  /**
   * Recurso para setear metadatos de un archivo multimedia.
   */
  // @Post('/:mediaId/metadata')
  // async setMetadata(@Param('mediaId') mediaId: string, @Body() metadata: any) {
  //   this.logger.debug(`Seteando metadatos para el fichero con id: ${mediaId}`);
  //   await this.storageService.setMetadata('media/' + mediaId, metadata);
  //   this.logger.debug(`Metadatos seteados para el fichero con id: ${mediaId}`);

  //   return { success: true };
  // }
}
