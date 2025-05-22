import json
import logging
from typing import List, Dict, Any
from openai import OpenAI  # Updated import
from config import OPENAI_API_KEY, OPENAI_MODEL

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)  # Updated initialization


def extract_topics(text: str) -> List[str]:
    """
    Extrae los tópicos principales del texto usando OpenAI.

    Args:
        text: El texto del documento a analizar

    Returns:
        Una lista de tópicos identificados
    """
    prompt = f"""
    Analiza el siguiente texto y extrae los tópicos o categorías principales.
    Devuelve únicamente los tópicos en formato JSON como una lista de strings.
    Por ejemplo: ["Solicitud de anulación", "Actualización de datos"]
    
    Texto a analizar:
    {text}
    """

    # Llamada a OpenAI para extraer tópicos - actualizada a la nueva API
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    content = response.choices[0].message.content
    return _parse_json_response(content, "tópicos")


def generate_questions(text: str, topics: List[str]) -> List[str]:
    """
    Genera una lista de posibles preguntas sobre el texto usando OpenAI.

    Args:
        text: El texto del documento
        topics: Los tópicos identificados previamente

    Returns:
        Una lista de preguntas generadas
    """
    # Incluir los tópicos para generar preguntas más relevantes
    topics_text = ", ".join(topics)

    prompt = f"""
    Basándote en el siguiente texto y sus tópicos identificados, genera una lista de 5
    preguntas frecuentes que podrían hacer los usuarios sobre este contenido. Tener en cuenta que las preguntas puedan ser respondidas con el texto proporcionado.
    Devuelve únicamente las preguntas en formato JSON como una lista de strings.
    Por ejemplo: ["¿Puedo anular una transacción desde la gestión externa?", 
    "¿Qué hago si ya realicé 5 anulaciones?"]
    
    Tópicos identificados: {topics_text}
    
    Texto:
    {text}
    """

    # Llamada a OpenAI para generar preguntas - actualizada a la nueva API
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    content = response.choices[0].message.content
    return _parse_json_response(content, "preguntas")


def _parse_json_response(response_text: str, item_type: str) -> List[str]:
    """
    Función auxiliar para extraer una lista JSON de una respuesta de texto.

    Args:
        response_text: El texto de respuesta que contiene JSON
        item_type: Tipo de elementos que se están extrayendo (para logging)

    Returns:
        Lista de strings extraída del JSON
    """
    try:
        # Extraer el JSON de la respuesta
        json_string = response_text.strip()
        # Buscar brackets si la respuesta contiene texto extra
        if not json_string.startswith("["):
            start = json_string.find("[")
            end = json_string.rfind("]") + 1
            if start != -1 and end != 0:
                json_string = json_string[start:end]

        return json.loads(json_string)
    except json.JSONDecodeError as e:
        logging.error(f"Error al decodificar JSON de {item_type}: {e}")
        logging.error(f"Respuesta de OpenAI: {response_text}")
        return []


def create_embeddings(pages: List[str]) -> List[Any]:
    """
    Crea embeddings para cada página del documento usando OpenAI.

    Args:
        pages: Lista de textos de páginas

    Returns:
        Lista de embeddings
    """
    result_embeddings = []

    # Procesar páginas individualmente para evitar límites de token
    for page in pages:
        try:
            # Actualizada a la nueva API
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=page
            )
            # En la nueva API, el embedding se accede de manera diferente
            embedding_vector = response.data[0].embedding
            result_embeddings.append(embedding_vector)
        except Exception as e:
            logging.error(f"Error al generar embedding con OpenAI: {e}")
            # Devolver un vector vacío en caso de error
            result_embeddings.append(
                [0.0] * 1536
            )  # Dimension for OpenAI text-embedding-3-small embeddings

    return result_embeddings


print("Servicios de IA cargados")
