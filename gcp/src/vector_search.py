"""Módulo para manejar las operaciones de búsqueda vectorial con Redis.
Implementa funciones para indexar y buscar embeddings de documentos.
"""

import logging
import numpy as np
import os
from typing import Dict, List, Any, Optional, Tuple
import uuid

from redisvl.index import SearchIndex
from redisvl.query import VectorQuery
from redis import Redis

# Importar cliente desde config
import config

# Configuración
VECTOR_DIMS = 1536  # Dimensiones para text-embedding-3-small
DEFAULT_PREFIX = "docs"


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
            raise RuntimeError("No se pudo inicializar el cliente Redis. Verifique la configuración y conexión.")
    return config.REDIS_CLIENT


def get_index_schema(index_name: str, prefix: str = DEFAULT_PREFIX, vector_dims: int = VECTOR_DIMS):
    """
    Define el esquema para el índice de Redis Vector Search.

    Args:
        index_name: Nombre del índice
        prefix: Prefijo para las claves de Redis
        vector_dims: Dimensiones del vector de embedding

    Returns:
        Esquema del índice
    """
    return {
        "index": {
            "name": index_name,
            "prefix": prefix,
        },
        "name": index_name,  # Añadiendo el nombre al nivel raíz del esquema
        "fields": [
            {"name": "filename", "type": "tag"},
            {"name": "page", "type": "numeric"},
            {"name": "content", "type": "text"},
            {
                "name": "embedding",
                "type": "vector",
                "attrs": {
                    "dims": vector_dims,
                    "distance_metric": "cosine",
                    "algorithm": "flat",
                    "datatype": "float32",
                },
            },
        ],
    }


def create_index_if_not_exists(index_name: str):
    """
    Crea el índice si no existe.
    Utiliza el cliente Redis del módulo de configuración.

    Args:
        index_name: Nombre del índice

    Returns:
        Objeto de índice
    """
    # Usar el cliente Redis compartido desde config
    client = get_redis_client()
    schema = get_index_schema(index_name)
    
    # Usar el cliente directamente
    index = SearchIndex.from_dict(schema, client=client)
    
    try:
        # Verificar si el índice ya existe
        info = index.info()
        logging.info(f"Índice {index_name} ya existe: {info}")
    except Exception as e:
        # Crear el índice si no existe
        logging.info(f"Creando índice {index_name}: {e}")
        index.create()
        
    return index


def vector_to_bytes(vector):
    """
    Convierte un vector numpy a bytes para almacenamiento.

    Args:
        vector: Vector numpy o lista de floats

    Returns:
        Representación en bytes del vector
    """
    return np.array(vector, dtype=np.float32).tobytes()


def index_pages(index_name: str, filename: str, pages: List[str], embeddings: List[Any]):
    """
    Indexa las páginas de un documento en Redis Vector Search.

    Args:
        index_name: Nombre del índice
        filename: Nombre del archivo
        pages: Lista de textos de páginas
        embeddings: Lista de embeddings correspondientes a cada página
    """
    # Crear o obtener índice usando el cliente de config
    index = create_index_if_not_exists(index_name)
    
    # Preparar datos para indexación
    documents = []
    for page_num, (page_text, embedding) in enumerate(zip(pages, embeddings)):
        document = {
            "filename": filename,
            "page": page_num,
            "content": page_text,
            "embedding": vector_to_bytes(embedding),
        }
        documents.append(document)
    
    # Cargar documentos en el índice
    keys = index.load(documents)
    logging.info(f"Indexadas {len(keys)} páginas del documento {filename}")
    
    return keys


def remove_datapoints(index_name: str, filename: str, page_count: int):
    """
    Elimina los datapoints de un documento del índice.

    Args:
        index_name: Nombre del índice
        filename: Nombre del archivo
        page_count: Número de páginas a eliminar
    """
    # Crear o obtener índice usando el cliente de config
    index = create_index_if_not_exists(index_name)
    
    # Obtener el cliente Redis desde config
    client = get_redis_client()
    
    # Obtener el prefijo desde el esquema del índice
    schema_dict = index.schema.to_dict()
    prefix = schema_dict["index"]["prefix"] if "prefix" in schema_dict.get("index", {}) else DEFAULT_PREFIX
    
    # Buscar y eliminar todas las páginas del documento
    pattern = f"{prefix}:*"
    keys_to_delete = []
    
    for key in client.scan_iter(match=pattern):
        key_str = key.decode('utf-8')
        # Obtener los metadatos para verificar el filename
        try:
            metadata = client.hgetall(key)
            if not metadata:
                continue
                
            # Verificar si la clave pertenece al documento que queremos eliminar
            if b'filename' in metadata and metadata[b'filename'].decode('utf-8') == filename:
                keys_to_delete.append(key)
        except Exception as e:
            logging.error(f"Error al procesar clave {key}: {e}")
    
    # Eliminar las claves encontradas
    if keys_to_delete:
        client.delete(*keys_to_delete)
        logging.info(f"Eliminadas {len(keys_to_delete)} datapoints para {filename}")


def search_similar_content(index_name: str, query_vector: Any, num_results: int = 5):
    """
    Busca contenido similar basado en similitud vectorial.

    Args:
        index_name: Nombre del índice
        query_vector: Vector de consulta
        num_results: Número de resultados a devolver

    Returns:
        Lista de resultados similares
    """
    # Crear o obtener índice usando el cliente de config
    index = create_index_if_not_exists(index_name)
    
    # Crear consulta vectorial
    query = VectorQuery(
        vector=query_vector if not hasattr(query_vector, 'values') else query_vector.values,
        vector_field_name="embedding",
        return_fields=["filename", "page", "content", "vector_distance"],
        num_results=num_results,
    )
    
    # Ejecutar búsqueda
    results = index.query(query)
    
    return results


print("Servicios de búsqueda vectorial con Redis cargados")
