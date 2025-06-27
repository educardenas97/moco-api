/**
 * Plantillas de prompts centralizadas para consultas legales
 * Esta clase contiene todas las instrucciones del sistema y prompts reutilizables
 */
export class LegalPromptTemplates {
  /**
   * Mensaje del sistema por defecto para asesores legales
   */
  static readonly DEFAULT_SYSTEM_MESSAGE =
    'Eres un asesor legal experto que responde con precisión y claridad, citando las fuentes legales correspondientes.';

  /**
   * Genera un prompt estructurado para consultas legales
   * @param query La consulta del usuario
   * @param context El contexto de documentos legales
   * @param country El país o legislación (por defecto 'paraguaya')
   * @returns El prompt completo estructurado
   */
  static generateLegalQueryPrompt(
    query: string,
    context: string,
    country: string = 'paraguaya',
  ): string {
    return `
        Eres un asistente legal especializado en la legislación ${country}. La consulta es:

        "${query}"

        Basado en los siguientes documentos legales, proporciona una respuesta clara, precisa y fundamentada:

        ${context}

        Tu respuesta debe:
        1. Explicar los aspectos legales relevantes a la consulta
        2. Citar las leyes, decretos o tratados específicos que apliquen
        3. Presentar la información de manera estructurada y comprensible
        4. En caso de no encontrar información relevante, indicar que no se encontró respuesta
        5. Si la consulta no es legal o sobre legislación, indicar que no es posible responder
        6. Si la consulta es sobre legislación de otro país, indicar que no es posible responder

        El formato de salida siempre debe ser en Markdown, con encabezados y listas numeradas o con viñetas según corresponda.
            `.trim();
  }

  /**
   * Genera el contexto de documentos en formato estándar
   * @param documents Lista de documentos recuperados
   * @returns Contexto formateado para el prompt
   */
  static formatDocumentsContext(
    documents: Array<{ title: string; content: string }>,
  ): string {
    return documents
      .map((doc) => `--- Documento: ${doc.title} ---\n${doc.content}`)
      .join('\n\n');
  }

  /**
   * Genera un mensaje del sistema personalizado
   * @param country País o legislación
   * @returns Mensaje del sistema personalizado
   */
  static generateSystemMessage(country: string = 'paraguaya'): string {
    let message = this.DEFAULT_SYSTEM_MESSAGE;
    message += ` Tu conocimiento se centra en la legislación ${country}.`;
    return message;
  }

  /**
   * Plantilla de respuesta cuando no se encuentran documentos relevantes
   */
  static readonly NO_DOCUMENTS_RESPONSE =
    'No se encontraron documentos legales relevantes para responder a esta consulta.';

  /**
   * Plantilla de respuesta cuando hay error en la generación
   */
  static readonly ERROR_RESPONSE = 'No se pudo generar una respuesta.';
}
