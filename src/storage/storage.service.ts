import { StorageFile } from './storage.file';
import { DownloadResponse, Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import StorageConfig from './storage.config';
import { Logger } from '@nestjs/common';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    // Configuración de la conexión a Google Cloud Storage
    this.storage = new Storage({
      projectId: StorageConfig.projectId,
      //Si existe la variable de entorno GOOGLE_CREDENTIALS_PATH se utiliza para la autenticación
      //Si no existe se utiliza GOOGLE_APPLICATION_CREDENTIALS
      keyFilename: process.env.GOOGLE_CREDENTIALS_PATH,
      // credentials:
      //   process.env.GOOGLE_CREDENTIALS_PATH !== undefined
      //     ? process.env.GOOGLE_CREDENTIALS_PATH
      //     : JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}'),
    });

    if (!StorageConfig.mediaBucket) {
      throw new Error(
        'Media bucket is not defined in the storage configuration',
      );
    }
    this.bucket = StorageConfig.mediaBucket;
  }

  /**
   * Metodo para guardar un fichero
   *
   * @param path
   * @param contentType
   * @param media
   * @param metadata
   * @returns
   */
  async save(
    path: string,
    contentType: string,
    media: Buffer,
    metadata: { [key: string]: string }[],
  ): Promise<{ success: boolean; message: string }> {
    this.logger.debug(`Guardando fichero en ${path}`);
    // Utiliza spread operator para combinar metadatos
    const object = metadata.reduce((obj, item) => ({ ...obj, ...item }), {});
    const file = this.storage.bucket(this.bucket).file(path);
    this.logger.debug(`Guardando fichero como ${file.name}`);
    const stream = file.createWriteStream();

    // Se retorna una promesa que se resuelve al finalizar la escritura del stream
    return new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        try {
          await file.setMetadata({ metadata: object, contentType });
          this.logger.debug(`Fichero ${file.name} guardado en ${path}`);
          resolve({
            success: true,
            message: `Fichero ${file.name} guardado en ${path}`,
          });
        } catch (error) {
          this.logger.error(`Error al guardar el fichero: ${error}`);
          reject({
            success: false,
            message: `Error al guardar el fichero: ${error}`,
          });
        }
      });

      stream.on('error', (error) => {
        this.logger.error(`Error al guardar el fichero: ${error}`);
        reject({
          success: false,
          message: `Error al guardar el fichero: ${error}`,
        });
      });

      stream.end(media);
    });
  }

  /**
   * Metodo para eliminar un fichero
   * @param path
   * @returns Boolean
   */
  async delete(path: string) {
    this.logger.debug(
      `Eliminando fichero con path: ${path} en el bucket: ${this.bucket}`,
    );
    const file = this.storage.bucket(this.bucket).file(path);
    const [exists] = await file.exists();
    if (!exists) {
      this.logger.warn(
        `Fichero con path: ${path} no encontrado en el bucket: ${this.bucket}`,
      );
      return false;
    }
    await file.delete();
    this.logger.debug(
      `Fichero con path: ${path} eliminado en el bucket: ${this.bucket}`,
    );
    return true;
  }

  /**
   * Metodo para obtener un fichero
   * @param path
   * @returns Promise<StorageFile>
   */
  async get(path: string): Promise<StorageFile> {
    // Descarga del fichero utilizando await
    const [buffer] = await this.storage
      .bucket(this.bucket)
      .file(path)
      .download();
    const storageFile = new StorageFile();
    storageFile.buffer = buffer;
    storageFile.metadata = new Map<string, string>();
    return storageFile;
  }

  /**
   * Metodo para obtener un fichero con metadatos
   *
   * @param path
   * @returns
   */
  async getWithMetaData(path: string): Promise<StorageFile> {
    // Obtener metadatos y contenido del fichero de manera secuencial
    const [metadata] = await this.storage
      .bucket(this.bucket)
      .file(path)
      .getMetadata();
    const [buffer] = await this.storage
      .bucket(this.bucket)
      .file(path)
      .download();

    const storageFile = new StorageFile();
    storageFile.buffer = buffer;
    storageFile.metadata = new Map<string, string>(
      Object.entries(metadata || {}) as [string, string][],
    );
    storageFile.contentType = storageFile.metadata.get('contentType') || '';
    return storageFile;
  }

  /**
   * Metodo para listar los archivos de un directorio
   * @param path
   * @returns Promise<Obj[]>
   */
  async listFiles(path: string): Promise<{ name: string; size: number }[]> {
    this.logger.debug(`Listando ficheros en el directorio: ${path}`);
    try {
      const [files] = await this.storage
        .bucket(this.bucket)
        .getFiles({ prefix: path });
      this.logger.debug(
        `Ficheros encontrados en el directorio: ${files.length}`,
      );
      return files
        .sort(
          (a: any, b: any) => b.metadata.timeCreated - a.metadata.timeCreated,
        )
        .map((file) => ({
          name: file.name,
          size: Number(file.metadata.size) || 0,
          metadata: file.metadata.metadata || {},
        }));
    } catch (error) {
      this.logger.error(
        `Error al listar los ficheros en el directorio: ${path}`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Metodo para setear metadatos de un archivo
   * @param path
   * @param metadata
   */
  async setMetadata(path: string, metadata: { [key: string]: string }) {
    this.logger.debug(`Seteando metadatos para el fichero con path: ${path}`);
    try {
      await this.storage
        .bucket(this.bucket)
        .file(path)
        .setMetadata({ metadata });
      this.logger.debug(`Metadatos seteados para el fichero con path: ${path}`);
    } catch (error) {
      this.logger.error(
        `Error al setear metadatos para el fichero con path: ${path}`,
      );
      throw error;
    }
  }
}
