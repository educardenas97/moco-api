import { Injectable, Logger } from '@nestjs/common';
import { DocumentContentService } from './document-content-service.interface';
import { Firestore } from '@google-cloud/firestore';

@Injectable()
export class FirestoreDocumentContentService implements DocumentContentService {
  private readonly logger = new Logger(FirestoreDocumentContentService.name);
  private firestore: Firestore;

  constructor() {
    this.firestore = new Firestore({
      projectId: process.env.GCP_PROJECT_ID,
      databaseId: 'knowledge-base-database',
      credentials:
        process.env.GOOGLE_CREDENTIALS_PATH !== undefined
          ? process.env.GOOGLE_CREDENTIALS_PATH
          : JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}'),
    });
  }

  /**
   * Metodo para obtener el texto de un documento almacenado en Firestore
   *
   * @param filename
   * @param pageNumber
   * @returns
   */
  async getDocumentText(
    filename: string,
    pageNumber: number,
  ): Promise<{
    text: string;
    metadata?: object;
  }> {
    try {
      const docRef = this.firestore.collection('documents').doc(filename);
      this.logger.debug(`Obteniendo documento ${filename} desde Firestore`);

      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        this.logger.warn(`Documento ${filename} no encontrado en Firestore`);
        return {
          text: '',
        };
      }

      const data = docSnap.data();
      if (!data || !data.pages || !Array.isArray(data.pages)) {
        throw new Error(
          `El documento ${filename} no contiene la estructura esperada (pages).`,
        );
      }

      this.logger.debug(
        `Página ${pageNumber} obtenida del documento ${filename}`,
      );

      return {
        text: data.pages[pageNumber],
        metadata: data?.metadata,
      };
    } catch (error) {
      this.logger.error('Error al obtener el documento desde Firestore', error);
      throw error;
    }
  }

  /**
   * Metodo para obtener los tópicos de un documento almacenado en Firestore
   * @param filename
   * @returns Promises<string[]>
   * @throws Error si el documento no existe o no tiene la estructura esperada
   */
  async getDocumentTopics(filename: string): Promise<string[]> {
    try {
      const docRef = this.firestore.collection('topics').doc(filename);
      this.logger.debug(
        `Obteniendo tópicos del documento ${filename} desde Firestore`,
      );

      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        this.logger.warn(`Documento ${filename} no encontrado en Firestore`);
        return [];
      }

      const data = docSnap.data();
      if (!data || !data.topics || !Array.isArray(data.topics)) {
        throw new Error(
          `El documento ${filename} no contiene la estructura esperada (topics).`,
        );
      }

      this.logger.debug(`Tópicos obtenidos del documento ${filename}`);

      return data.topics;
    } catch (error) {
      this.logger.error('Error al obtener los tópicos desde Firestore', error);
      throw error;
    }
  }

  /**
   * Metodo para obtener preguntas frecuentes de un documento almacenado en Firestore
   * @param filename
   * @returns Promises<string[]>
   * @throws Error si el documento no existe o no tiene la estructura esperada
   */
  async getDocumentFAQs(filename: string): Promise<string[]> {
    try {
      const docRef = this.firestore.collection('faqs').doc(filename);
      this.logger.debug(
        `Obteniendo FAQs del documento ${filename} desde Firestore`,
      );

      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        this.logger.warn(`Documento ${filename} no encontrado en Firestore`);
        return [];
      }

      const data = docSnap.data();
      if (!data || !data.questions || !Array.isArray(data.questions)) {
        throw new Error(
          `El documento ${filename} no contiene la estructura esperada (questions).`,
        );
      }

      this.logger.debug(`questions obtenidas del documento ${filename}`);

      return data.questions;
    } catch (error) {
      this.logger.error('Error al obtener las FAQs desde Firestore', error);
      throw error;
    }
  }

  /**
   * Metodo para obtener todos los tópicos almacenados en el sistema de archivos
   */
  async getTopics(): Promise<string[]> {
    try {
      const collectionRef = this.firestore.collection('topics');
      const snapshot = await collectionRef.get();

      if (snapshot.empty) {
        this.logger.warn('No se encontraron documentos en la colección topics');
        return [];
      }

      const topics: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.topics && Array.isArray(data.topics)) {
          topics.push(...data.topics);
        }
      });

      this.logger.debug(`Tópicos obtenidos desde Firestore: ${topics}`);
      return topics;
    } catch (error) {
      this.logger.error('Error al obtener los tópicos desde Firestore', error);
      throw error;
    }
  }

  /**
   * Metodo para obtener preguntas frecuentes de un documento almacenado en Firestore
   * @param filename
   * @returns Promises<string[]>
   * @throws Error si el documento no existe o no tiene la estructura esperada
   */
  async getFAQs(): Promise<string[]> {
    try {
      const collectionRef = this.firestore.collection('questions');
      const snapshot = await collectionRef.get();

      if (snapshot.empty) {
        this.logger.warn(
          'No se encontraron documentos en la colección questions',
        );
        return [];
      }

      const faqs: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.questions && Array.isArray(data.questions)) {
          faqs.push(...data.questions);
        }
      });

      this.logger.debug(`FAQs obtenidas desde Firestore: ${faqs}`);
      return faqs;
    } catch (error) {
      this.logger.error('Error al obtener las FAQs desde Firestore', error);
      throw error;
    }
  }
}
