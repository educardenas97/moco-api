"""
Módulo principal para la función de Cloud Functions.
Contiene la función principal que procesa eventos de Cloud Storage.
"""

import logging
import functions_framework
import atexit
from cloudevents.http import CloudEvent
from datetime import datetime

# Importar módulos del proyecto
import config
from database_service import get_document, get_redis_client
from document_handlers import (
    handle_document_creation,
    handle_document_update,
    handle_document_deletion,
)

# Inicializar servicios
config.initialize_services()

# Registrar solo la función de cierre de conexiones de config.py
# ya que ahora todos los módulos usan el mismo cliente Redis
atexit.register(config.close_services)


@functions_framework.cloud_event
def on_cloud_event(event: CloudEvent) -> None:
    """
    Procesa eventos de Cloud Storage para documentos.
    Se manejan:
    - google.cloud.storage.object.v1.finalized y google.cloud.storage.object.v1.metadataUpdated:
      Se trata de un nuevo documento o de una actualización. Se procesa el documento.
    - google.cloud.storage.object.v1.deleted:
      Se elimina el documento: se remueven las referencias en Redis y en el índice.

    Args:
        event: Evento de Cloud Storage
    """
    try:
        event_type = event["type"]
        event_id = event.data["id"]
        input_bucket = event.data["bucket"]
        filename = event.data["name"]

        logging.info(f"Procesando evento {event_type} para {filename}")

        if event_type == "google.cloud.storage.object.v1.deleted":
            handle_document_deletion(event_id, input_bucket, filename)
        elif event_type in [
            "google.cloud.storage.object.v1.finalized",
            "google.cloud.storage.object.v1.metadataUpdated",
        ]:
            # Obtener documento actual para determinar si es creación o actualización
            redis_client = get_redis_client()
            doc_data = get_document(redis_client, filename)

            if doc_data:
                # Es una actualización
                handle_document_update(
                    event_id=event_id,
                    input_bucket=input_bucket,
                    filename=filename,
                    mime_type=event.data["contentType"],
                    time_uploaded=datetime.fromisoformat(event.data["timeCreated"]),
                    existing_doc=doc_data,
                )
            else:
                # Es una creación
                handle_document_creation(
                    event_id=event_id,
                    input_bucket=input_bucket,
                    filename=filename,
                    mime_type=event.data["contentType"],
                    time_uploaded=datetime.fromisoformat(event.data["timeCreated"]),
                )
        else:
            logging.info(f"Ignorando evento no soportado: {event_type}")
    except Exception as e:
        # En caso de error, eliminar la conexión Redis
        # y registrar el error
        config.close_services()
        logging.exception(e, stack_info=True)


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    logging.info("🟢 Función Cloud inicializada y lista para procesar eventos")
