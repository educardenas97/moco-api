"""
Módulo para manejar operaciones con Cloud Storage.
Implementa funciones para obtener metadatos de archivos.
"""

import logging
from google.cloud import storage


def get_blob_metadata(bucket_name: str, filename: str):
    """
    Obtiene los metadatos personalizados de un blob en Cloud Storage.

    Args:
        bucket_name: Nombre del bucket
        filename: Nombre del archivo/blob

    Returns:
        Metadatos personalizados o None si no existen
    """
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.get_blob(filename)

        if blob and blob.metadata and "metadata" in blob.metadata:
            return blob.metadata["metadata"]

        return None
    except Exception as e:
        logging.error(f"Error al obtener metadatos de {filename}: {e}")
        return None


def check_blob_exists(bucket_name: str, filename: str):
    """
    Verifica si un blob existe en Cloud Storage.

    Args:
        bucket_name: Nombre del bucket
        filename: Nombre del archivo/blob

    Returns:
        True si el blob existe, False en caso contrario
    """
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(filename)

        return blob.exists()
    except Exception as e:
        logging.error(f"Error al verificar existencia de {filename}: {e}")
        return False


def list_folder_contents(bucket_name: str, folder_prefix: str):
    """
    Lista el contenido de una carpeta en Cloud Storage.

    Args:
        bucket_name: Nombre del bucket
        folder_prefix: Prefijo de la carpeta

    Returns:
        Lista de nombres de archivos
    """
    try:
        storage_client = storage.Client()
        blobs = storage_client.list_blobs(bucket_name, prefix=folder_prefix)

        # Filtrar carpetas virtuales (terminan en /)
        return [blob.name for blob in blobs if not blob.name.endswith("/")]
    except Exception as e:
        logging.error(f"Error al listar contenido de {folder_prefix}: {e}")
        return []


print("Servicios de almacenamiento cargados")
