import logging
from typing import Generator
from google.cloud import documentai
from google.cloud import storage
import config


def get_document_text(
    input_file: str,
    mime_type: str,
    processor_id: str,
    temp_bucket: str,
) -> Generator[str, None, None]:
    """
    Realiza OCR en un archivo de Cloud Storage usando Document AI.

    Args:
        input_file: URI de GCS del archivo a procesar (gs://bucket/filename)
        mime_type: Tipo MIME del documento
        processor_id: ID del procesador de Document AI
        temp_bucket: Bucket para almacenar resultados temporales

    Returns:
        Generador con el texto de cada página del documento
    """
    # Crear cliente de Document AI
    documentai_client = documentai.DocumentProcessorServiceClient(
        client_options=config.get_docai_client_options()
    )

    # Configurar solicitud de procesamiento por lotes
    operation = documentai_client.batch_process_documents(
        request=documentai.BatchProcessRequest(
            name=processor_id,
            input_documents=documentai.BatchDocumentsInputConfig(
                gcs_documents=documentai.GcsDocuments(
                    documents=[
                        documentai.GcsDocument(
                            gcs_uri=input_file,
                            mime_type=mime_type,
                        ),
                    ],
                ),
            ),
            document_output_config=documentai.DocumentOutputConfig(
                gcs_output_config=documentai.DocumentOutputConfig.GcsOutputConfig(
                    gcs_uri=f"gs://{temp_bucket}/ocr/{input_file.split('gs://')[-1]}",
                ),
            ),
        ),
    )

    # Esperar a que se complete la operación
    logging.info(f"Procesando documento con Document AI: {input_file}")
    operation.result()

    # Obtener resultados del procesamiento
    storage_client = storage.Client()
    metadata = documentai.BatchProcessMetadata(operation.metadata)
    output_gcs_path = metadata.individual_process_statuses[0].output_gcs_destination

    # Extraer el bucket y prefijo del path de salida
    (output_bucket, output_prefix) = output_gcs_path.removeprefix("gs://").split("/", 1)

    # Recorrer los blobs de salida y extraer el texto de cada página
    for blob in storage_client.list_blobs(output_bucket, prefix=output_prefix):
        blob_contents = blob.download_as_bytes()
        document = documentai.Document.from_json(
            blob_contents, ignore_unknown_fields=True
        )

        # Generar el texto de cada página
        for page in document.pages:
            # Extraer segmentos de texto
            segments = [
                (segment.start_index, segment.end_index)
                for segment in page.layout.text_anchor.text_segments
            ]

            # Unir los segmentos y devolver el texto completo de la página
            yield "\n".join([document.text[start:end] for (start, end) in segments])


print("Procesador de documentos cargado")
