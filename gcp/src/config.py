import os
import logging
import time
from google.api_core.client_options import ClientOptions
from google.cloud import aiplatform
import vertexai
from redis import Redis
from redis.exceptions import ConnectionError, TimeoutError

# Ubicaciones
VERTEXAI_LOCATION = os.environ.get("VERTEXAI_LOCATION", "us-central1")
DOCAI_LOCATION = os.environ.get("DOCAI_LOCATION", "us")

# IDs y nombres de recursos
OUTPUT_BUCKET = os.environ.get("OUTPUT_BUCKET")
INDEX_ID = os.environ.get("INDEX_ID")
DOCAI_PROCESSOR = os.environ.get("DOCAI_PROCESSOR")
# Variable de entorno para la clave de OpenAI
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
# Modelo de OpenAI a utilizar
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4.1")

# Configuración de Redis
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
REDIS_CLIENT = None
MAX_RETRY_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 1

# Muestra en consola las variables de entorno
logging.info(f"REDIS_URL: {REDIS_URL}")
logging.info(f"OUTPUT_BUCKET: {OUTPUT_BUCKET}")
logging.info(f"INDEX_ID: {INDEX_ID}")
logging.info(f"DOCAI_PROCESSOR: {DOCAI_PROCESSOR}")
logging.info(f"VERTEXAI_LOCATION: {VERTEXAI_LOCATION}")


# Inicialización de servicios
def initialize_services():
    """Inicializa los servicios de Vertex AI y Redis."""
    global REDIS_CLIENT
    
    # Inicializar Vertex AI
    vertexai.init(location=VERTEXAI_LOCATION)
    aiplatform.init(location=VERTEXAI_LOCATION)
    
    # Inicializar cliente Redis con reintentos
    retry_count = 0
    while REDIS_CLIENT is None and retry_count < MAX_RETRY_ATTEMPTS:
        try:
            logging.info(f"Intentando conectar a Redis en {REDIS_URL} (intento {retry_count + 1})")
            REDIS_CLIENT = Redis.from_url(REDIS_URL, socket_connect_timeout=5)
            
            # Verificar la conexión con un ping
            if REDIS_CLIENT.ping():
                logging.info(f"Conexión a Redis establecida exitosamente")
            else:
                logging.warning("No se recibió respuesta al ping de Redis")
                REDIS_CLIENT = None
                retry_count += 1
                
        except (ConnectionError, TimeoutError) as e:
            logging.warning(f"Error al conectar a Redis: {e}")
            REDIS_CLIENT = None
            retry_count += 1
            
        except Exception as e:
            logging.error(f"Error inesperado al inicializar Redis: {e}")
            REDIS_CLIENT = None
            retry_count += 1
            
        if REDIS_CLIENT is None and retry_count < MAX_RETRY_ATTEMPTS:
            logging.info(f"Reintentando en {RETRY_DELAY_SECONDS} segundos...")
            time.sleep(RETRY_DELAY_SECONDS)
    
    if REDIS_CLIENT is None:
        logging.error(f"No se pudo establecer conexión con Redis después de {MAX_RETRY_ATTEMPTS} intentos")
    else:
        logging.info(f"Servicios inicializados - Vertex AI en {VERTEXAI_LOCATION}, Redis en {REDIS_URL}")


def close_services():
    """Cierra las conexiones de servicios para liberar recursos."""
    global REDIS_CLIENT
    
    # Cerrar cliente Redis
    if REDIS_CLIENT is not None:
        try:
            REDIS_CLIENT.close()
            logging.info("Conexión Redis cerrada correctamente")
        except Exception as e:
            logging.error(f"Error al cerrar la conexión Redis: {e}")
        finally:
            REDIS_CLIENT = None


# Opciones de cliente para Document AI
def get_docai_client_options():
    """Retorna las opciones de cliente para Document AI."""
    return ClientOptions(api_endpoint=f"{DOCAI_LOCATION}-documentai.googleapis.com")


logging.info("Configuración cargada")
