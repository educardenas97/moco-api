"""
Módulo para el manejo de documentos en Cloud Storage.
Contiene funciones para procesar creación, actualización y eliminación de documentos.
"""

import logging
from datetime import datetime

# Importar módulos del proyecto
import config
from database_service import (
    get_document,
    save_document_metadata,
    delete_document,
    get_redis_client,
)
from storage_service import get_blob_metadata
from vector_search import remove_datapoints
from content_processor import process_document_content


def handle_document_deletion(event_id: str, input_bucket: str, filename: str) -> None:
    """
    Maneja la eliminación de un documento.

    Args:
        event_id: ID del evento
        input_bucket: Nombre del bucket
        filename: Nombre del archivo
    """
    logging.info(f"{event_id}: Eliminando referencias para {filename}")

    # Obtener el cliente Redis
    redis_client = get_redis_client()

    # Obtener documento de Redis
    doc_data = get_document(redis_client, filename)

    # Eliminar datapoints del índice si existen
    old_page_count = 0
    if doc_data and "pages" in doc_data:
        old_page_count = len(doc_data["pages"])

    if old_page_count > 0:
        remove_datapoints(config.INDEX_ID, filename, old_page_count)
        logging.info(
            f"🗑️ Eliminadas {old_page_count} datapoints del índice para {filename}"
        )

    # Eliminar referencias en Redis
    delete_document(redis_client, filename)
    logging.info(f"🗑️ Referencias en Redis eliminadas para {filename}")


def handle_document_creation(
    event_id: str,
    input_bucket: str,
    filename: str,
    mime_type: str,
    time_uploaded: datetime,
) -> None:
    """
    Maneja la creación de un nuevo documento.

    Args:
        event_id: ID del evento
        input_bucket: Nombre del bucket
        filename: Nombre del archivo
        mime_type: Tipo MIME del archivo
        time_uploaded: Fecha de carga
    """
    logging.info(f"➕ {event_id}: Procesando NUEVO documento {filename}")

    # Obtener el cliente Redis
    redis_client = get_redis_client()

    # Obtener metadatos personalizados
    custom_metadata = get_blob_metadata(input_bucket, filename)

    # Crear registro inicial del documento
    doc_data = {
        "event_id": event_id,
        "bucket": input_bucket,
        "filename": filename,
        "mime_type": mime_type,
        "time_uploaded": (
            time_uploaded.isoformat()
            if isinstance(time_uploaded, datetime)
            else time_uploaded
        ),
        "metadata": custom_metadata,
        "creation_time": datetime.now().isoformat(),
        "is_new": True,
    }

    # Guardar metadatos iniciales
    save_document_metadata(
        redis_client=redis_client, filename=filename, metadata=doc_data
    )

    # Procesar el contenido del documento
    process_document_content(event_id, input_bucket, filename, mime_type, redis_client)


def handle_document_update(
    event_id: str,
    input_bucket: str,
    filename: str,
    mime_type: str,
    time_uploaded: datetime,
    existing_doc: dict,
) -> None:
    """
    Maneja la actualización de un documento existente.

    Args:
        event_id: ID del evento
        input_bucket: Nombre del bucket
        filename: Nombre del archivo
        mime_type: Tipo MIME del archivo
        time_uploaded: Fecha de carga
        existing_doc: Datos existentes del documento
    """
    logging.info(f"🔄 {event_id}: Actualizando documento existente {filename}")

    # Obtener el cliente Redis
    redis_client = get_redis_client()

    # Verificar si ya procesamos este evento
    if existing_doc.get("event_id") == event_id:
        logging.info(f"⏭️ {event_id}: Evento ya procesado anteriormente, ignorando")
        return

    # Eliminar datapoints del índice si existen
    old_page_count = len(existing_doc.get("pages", []))
    if old_page_count > 0:
        remove_datapoints(config.INDEX_ID, filename, old_page_count)
        logging.info(
            f"🗑️ Eliminadas {old_page_count} datapoints previas para {filename}"
        )

    # Eliminar referencias de tópicos y preguntas, pero preservamos el documento
    # Esto es más seguro que eliminar todo y volver a crear
    delete_document(redis_client, filename)

    # Obtener metadatos personalizados actualizados
    custom_metadata = get_blob_metadata(input_bucket, filename)

    # Actualizar metadatos manteniendo históricos como creation_time
    doc_data = {
        "event_id": event_id,
        "bucket": input_bucket,
        "filename": filename,
        "mime_type": mime_type,
        "time_uploaded": (
            time_uploaded.isoformat()
            if isinstance(time_uploaded, datetime)
            else time_uploaded
        ),
        "metadata": custom_metadata,
        "update_time": datetime.now().isoformat(),
        "is_new": False,
    }

    # Si había una fecha de creación, la mantenemos
    if "creation_time" in existing_doc:
        doc_data["creation_time"] = existing_doc["creation_time"]

    # Guardar metadatos actualizados - pasamos filename como parte del diccionario
    save_document_metadata(
        redis_client=redis_client, filename=filename, metadata=doc_data
    )

    # Procesar el contenido del documento
    process_document_content(event_id, input_bucket, filename, mime_type, redis_client)
