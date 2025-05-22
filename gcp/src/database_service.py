"""
Módulo para interactuar con Redis como base de datos.
Implementa operaciones CRUD para documentos, tópicos y preguntas.
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from redis import Redis

# Importar cliente desde el módulo config
import config

# Configurar un logger específico para las operaciones de Redis
redis_logger = logging.getLogger("redis_operations")
redis_logger.setLevel(logging.DEBUG)


def get_redis_client():
    """
    Obtiene el cliente Redis desde el módulo config.
    Si el cliente de config no está inicializado, lo inicializa.

    Returns:
        Cliente Redis
    """
    if config.REDIS_CLIENT is None:
        # Si el cliente no está inicializado, intentamos inicializarlo
        config.initialize_services()
        if config.REDIS_CLIENT is None:
            # Si sigue siendo None, lanzamos un error más explicativo
            raise RuntimeError(
                "No se pudo inicializar el cliente Redis. Verifique la configuración y conexión."
            )
    return config.REDIS_CLIENT


def get_document(redis_client: Redis, filename: str) -> Optional[Dict[str, Any]]:
    """
    Obtiene la información de un documento guardado en Redis.

    Args:
        redis_client: Cliente de Redis
        filename: Nombre del archivo/documento

    Returns:
        Datos del documento o None si no existe
    """
    # Usar un formato de clave específico para documentos
    key = f"document:{filename.replace('/', '-')}"
    redis_logger.debug(f"GET Redis - Consultando documento: {key}")
    doc_json = redis_client.get(key)

    if not doc_json:
        redis_logger.debug(f"GET Redis - Documento no encontrado: {key}")
        return None

    try:
        logging.debug(f"Documento encontrado: {doc_json}")
        return json.loads(doc_json)
    except json.JSONDecodeError as e:
        logging.error(f"Error decodificando documento {filename}: {e}")
        return None


def save_document_metadata(redis_client: Redis, filename=None, metadata=None) -> None:
    """
    Guarda o actualiza los metadatos de un documento en Redis.

    Args:
        redis_client: Cliente de Redis
        filename: Nombre del archivo/documento. Si es None, se buscará en metadata.
        metadata: Metadatos a guardar
    """
    key = f"document:{filename.replace('/', '-')}"
    redis_logger.debug(
        f"SET Redis - Guardando documento: {key}, fields: {list(metadata.keys())}"
    )

    try:
        # Verificar que metadata no sea None
        if metadata is None:
            raise ValueError("Los metadatos no pueden ser None")

        # Guardar los datos directamente sin el objeto metadata envolvente
        document_data = {**metadata, "filename": filename}
        redis_client.set(key, json.dumps(document_data))
        redis_logger.debug(f"SET Redis - Documento guardado: {key}")
        logging.debug(f"Metadatos guardados para documento {filename}")
    except Exception as e:
        redis_logger.error(f"Error al guardar documento {key}: {str(e)}")
        logging.error(f"Error al guardar metadatos para {filename}: {e}")


def save_topics_and_questions(
    redis_client: Redis, filename: str, topics: List[str], questions: List[str]
) -> Dict[str, str]:
    """
    Guarda tópicos y preguntas relacionadas con un documento en Redis.

    Args:
        redis_client: Cliente de Redis
        filename: Nombre del archivo/documento
        topics: Lista de tópicos identificados
        questions: Lista de preguntas generadas

    Returns:
        Referencias a los objetos guardados
    """
    file_key = filename.replace("/", "-")

    # Guardar tópicos
    topics_key = f"topics:{file_key}"
    redis_logger.debug(f"SET Redis - Guardando tópicos: {topics_key}")
    redis_client.set(topics_key, json.dumps({"filename": filename, "topics": topics}))

    # Guardar preguntas
    questions_key = f"questions:{file_key}"
    redis_logger.debug(f"SET Redis - Guardando preguntas: {questions_key}")
    redis_client.set(
        questions_key, json.dumps({"filename": filename, "questions": questions})
    )

    # Devolver referencias para actualizar el documento principal
    return {"topics_ref": topics_key, "questions_ref": questions_key}


def delete_document(redis_client: Redis, filename: str) -> None:
    """
    Elimina un documento y sus datos relacionados de Redis.

    Args:
        redis_client: Cliente de Redis
        filename: Nombre del archivo/documento
    """
    file_key = filename.replace("/", "-")

    # Eliminar documento principal
    document_key = f"document:{file_key}"
    redis_logger.debug(f"DEL Redis - Eliminando documento: {document_key}")
    redis_client.delete(document_key)

    # Eliminar tópicos y preguntas asociados
    topics_key = f"topics:{file_key}"
    questions_key = f"questions:{file_key}"
    redis_logger.debug(
        f"DEL Redis - Eliminando tópicos: {topics_key} y preguntas: {questions_key}"
    )
    redis_client.delete(topics_key, questions_key)

    # También se podrían eliminar otros recursos asociados si existen


def get_topics(redis_client: Redis, filename: str) -> List[str]:
    """
    Obtiene los tópicos asociados a un documento.

    Args:
        redis_client: Cliente de Redis
        filename: Nombre del archivo/documento

    Returns:
        Lista de tópicos
    """
    key = f"topics:{filename.replace('/', '-')}"
    redis_logger.debug(f"GET Redis - Consultando tópicos: {key}")
    topics_json = redis_client.get(key)

    if not topics_json:
        redis_logger.debug(f"GET Redis - Tópicos no encontrados: {key}")
        return []

    try:
        return json.loads(topics_json).get("topics", [])
    except json.JSONDecodeError:
        return []


def get_questions(redis_client: Redis, filename: str) -> List[str]:
    """
    Obtiene las preguntas asociadas a un documento.

    Args:
        redis_client: Cliente de Redis
        filename: Nombre del archivo/documento

    Returns:
        Lista de preguntas
    """
    key = f"questions:{filename.replace('/', '-')}"
    redis_logger.debug(f"GET Redis - Consultando preguntas: {key}")
    questions_json = redis_client.get(key)

    if not questions_json:
        redis_logger.debug(f"GET Redis - Preguntas no encontradas: {key}")
        return []

    try:
        return json.loads(questions_json).get("questions", [])
    except json.JSONDecodeError:
        return []


print("Servicios de base de datos con Redis cargados")
