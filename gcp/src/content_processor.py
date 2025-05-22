"""
Módulo para el procesamiento del contenido de los documentos.
Contiene funciones para extraer texto, tópicos, preguntas e indexar contenido.
"""

import logging

# Importar módulos del proyecto
import config
from document_processor import get_document_text
from ai_service import extract_topics, generate_questions, create_embeddings
from database_service import (
    get_document,
    save_document_metadata,
    save_topics_and_questions,
)
from vector_search import index_pages


def process_document_content(
    event_id: str,
    input_bucket: str,
    filename: str,
    mime_type: str,
    redis_client,
) -> None:
    """
    Procesa el contenido de un documento: extrae texto, tópicos, preguntas e indexa.
    Esta función es común para creación y actualización.

    Args:
        event_id: ID del evento
        input_bucket: Nombre del bucket
        filename: Nombre del archivo
        mime_type: Tipo MIME del archivo
        redis_client: Cliente Redis
    """
    # Extraer texto del documento
    input_gcs_uri = f"gs://{input_bucket}/{filename}"
    logging.info(f"📄 {event_id}: Extrayendo texto del documento")
    pages = list(
        get_document_text(
            input_gcs_uri, mime_type, config.DOCAI_PROCESSOR, config.OUTPUT_BUCKET
        )
    )

    # Actualizar documento con páginas extraídas
    doc_data = get_document(redis_client, filename)
    if doc_data is None:
        logging.warning(
            f"⚠️ {event_id}: No se encontró el documento que acabamos de crear/actualizar"
        )
        doc_data = {
            "event_id": event_id,
            "filename": filename,
        }

    doc_data["pages"] = pages
    doc_data["page_count"] = len(pages)

    save_document_metadata(
        redis_client=redis_client, filename=filename, metadata=doc_data
    )

    # Concatenar todas las páginas para procesamiento con OpenAI
    full_text = "\n\n".join(pages)

    # Extraer tópicos
    logging.info(f"🤖 {event_id}: Extrayendo tópicos con OpenAI")
    topics = extract_topics(full_text)
    logging.info(f"📋 {event_id}: Tópicos extraídos: {topics}")

    # Generar preguntas
    logging.info(f"🤖 {event_id}: Generando preguntas con OpenAI")
    questions = generate_questions(full_text, topics)
    logging.info(f"❓ {event_id}: Preguntas generadas: {questions}")

    # Guardar tópicos y preguntas
    refs = save_topics_and_questions(
        redis_client=redis_client, filename=filename, topics=topics, questions=questions
    )

    # Actualizar documento con referencias
    doc_data = get_document(redis_client, filename)
    if doc_data is None:
        logging.warning(
            f"⚠️ {event_id}: No se encontró el documento después de guardar tópicos y preguntas"
        )
        doc_data = refs
    else:
        doc_data.update(refs)

    save_document_metadata(
        redis_client=redis_client, filename=filename, metadata=doc_data
    )

    # Crear embeddings e indexar páginas
    logging.info(f"📖 {event_id}: Indexando páginas en Vector Search")
    embeddings = create_embeddings(pages)
    index_pages(config.INDEX_ID, filename, pages, embeddings)
    logging.info(f"✅ {event_id}: Documento procesado exitosamente")
