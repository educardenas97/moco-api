# Procesador de Documentos en Google Cloud

Este proyecto implementa un sistema de procesamiento automático de documentos en Google Cloud, utilizando Cloud Functions para manejar eventos de almacenamiento, Document AI para extracción de texto, OpenAI para análisis de contenido y generación de embeddings, y Redis como base de datos vectorial y de metadatos.

## Características Principales

- 🔄 **Procesamiento automático de documentos** cuando se suben a Cloud Storage
- 🔍 **Extracción de texto mediante OCR** utilizando Document AI
- 🧠 **Análisis de contenido con OpenAI** para identificar tópicos y generar preguntas frecuentes
- 🔢 **Indexación y búsqueda vectorial con Redis Vector Search** para búsqueda semántica de alta precisión
- 💾 **Almacenamiento estructurado** de metadatos, tópicos y preguntas en Redis
- 🏗️ **Arquitectura modular** siguiendo principios de programación funcional

## 📁 Estructura del Proyecto
```
src/
├── main.py                # Punto de entrada 
├── config.py              # Configuración y variables de entorno
├── document_handlers.py   # Manejadores para diferentes eventos de documentos
├── content_processor.py   # Procesamiento del contenido de documentos
├── ai_services.py         # Servicios de IA (Gemini, embeddings)
├── storage_service.py     # Operaciones con Cloud Storage
├── database_service.py    # Operaciones con Redis
└── vector_search.py       # Operaciones con Vector Search en Redis
```

### 📋 Descripción de Módulos

- 🎯 **main.py**: Contiene la función principal `on_cloud_event` que procesa eventos de Cloud Storage y orquesta el flujo de trabajo.
- ⚙️ **config.py**: Centraliza todas las variables de entorno y configuraciones del sistema. Mantiene la conexión de Redis compartida.
- 📝 **document_handlers.py**: Maneja los diferentes tipos de eventos (creación, actualización, eliminación) de documentos.
- 📄 **content_processor.py**: Implementa la extracción de texto de documentos usando Document AI.
- 🤖 **ai_service.py**: Proporciona funciones para extraer tópicos, generar preguntas y crear embeddings utilizando OpenAI.
- 🗂️ **storage_service.py**: Maneja operaciones con Cloud Storage como obtener metadatos de archivos.
- 🗃️ **database_service.py**: Gestiona operaciones CRUD con Redis para almacenar y recuperar metadatos, tópicos y preguntas.
- 🔍 **vector_search.py**: Implementa funciones para indexar y buscar embeddings en Redis Vector Search.

## 🔧 Requisitos

- Google Cloud Project con las siguientes APIs habilitadas:
  - Cloud Functions
  - Cloud Storage
  - Document AI
- API Key de OpenAI
- Procesador de Document AI configurado
- Redis Stack con Redis Vector Search habilitado
  - Se requiere Redis Stack 7.2.0 o superior
  - Compatible con Redis Cloud o implementación local/self-hosted
  - Capacidad para indexar vectores de alta dimensionalidad (1536D)
- Permisos adecuados para la cuenta de servicio

## Variables de Entorno

La función requiere las siguientes variables de entorno:

| Variable | Descripción |
|----------|-------------|
| `DOCAI_LOCATION` | Ubicación de Document AI (default: "us") |
| `REDIS_URL` | URL de conexión a Redis (default: "redis://localhost:6379") |
| `OUTPUT_BUCKET` | Bucket para almacenar resultados temporales |
| `INDEX_ID` | ID del índice de Vector Search en Redis |
| `DOCAI_PROCESSOR` | ID completo del procesador de Document AI |
| `OPENAI_API_KEY` | API Key de OpenAI |
| `OPENAI_MODEL` | Modelo de OpenAI a utilizar (default: "gpt-4.1") |

## Configuración de Redis Vector Search

El sistema utiliza la biblioteca `redisvl` para crear y gestionar índices vectoriales en Redis:

```python
# Ejemplo de configuración del índice vectorial
{
    "index": {
        "name": "index_name",         # Nombre del índice definido en INDEX_ID
        "prefix": "docs",             # Prefijo para las claves en Redis
    },
    "fields": [
        {"name": "filename", "type": "tag"},               # Etiqueta para búsqueda exacta
        {"name": "page", "type": "numeric"},               # Campo numérico para paginación
        {"name": "content", "type": "text"},               # Texto completo para búsqueda fulltext
        {
            "name": "embedding",
            "type": "vector",
            "attrs": {
                "dims": 1536,                              # Dimensiones para embeddings de OpenAI
                "distance_metric": "cosine",               # Métrica de distancia
                "algorithm": "flat",                       # Algoritmo de búsqueda
                "datatype": "float32",                     # Tipo de datos
            },
        },
    ],
}
```

Los parámetros importantes a considerar para la implementación son:

1. **Dimensiones**: Configurado a 1536 para compatibilidad con `text-embedding-3-small` de OpenAI
2. **Distancia**: Utiliza la métrica de similitud del coseno para resultados más precisos
3. **Algoritmo**: Implementa FLAT para búsqueda exhaustiva (mejor precisión)
4. **Prefijo**: Todas las claves en Redis usan el prefijo "docs:" para el índice vectorial

## Implementación de Redis Vector Search

El sistema utiliza Redis no solo como base de datos para almacenar metadatos, sino también como motor de búsqueda vectorial mediante Redis Vector Search.

### Características de Redis Vector Search

- **Indexación eficiente**: Almacena embeddings como vectores de 1536 dimensiones (formato OpenAI text-embedding-3-small)
- **Búsqueda por similitud**: Permite buscar contenido semánticamente similar usando la distancia coseno
- **Algoritmo FLAT**: Implementa el algoritmo FLAT para una búsqueda vectorial precisa
- **Campos estructurados**: Cada entrada indexada contiene:
  - `filename`: Identificador del documento (campo tag)
  - `page`: Número de página (campo numérico)
  - `content`: Texto completo de la página (campo texto)
  - `embedding`: Vector de embedding (campo vector)

### Esquema de Datos en Redis

```
# Documentos
document:{filename} -> JSON con metadatos del documento

# Tópicos y preguntas
topics:{filename} -> JSON con tópicos extraídos
questions:{filename} -> JSON con preguntas generadas

# Vector Search (prefijo "docs")
docs:{uuid} -> Hash con campos {filename, page, content, embedding}
```

## Flujo de Trabajo

### Creación o Actualización de Documentos

1. Se sube un documento a Cloud Storage o se actualiza sus metadatos
2. Se activa la Cloud Function mediante un evento de Cloud Storage
3. Se extraen metadatos del documento y se guardan en Redis
4. Se procesa el documento con Document AI para extraer texto
5. Se utiliza OpenAI para extraer tópicos y generar preguntas frecuentes
6. Se almacenan los tópicos y preguntas en Redis
7. Se crean embeddings para cada página del documento usando OpenAI text-embedding-3-small
8. Se indexan los embeddings en Redis Vector Search para búsqueda semántica

### Eliminación de Documentos

1. Se elimina un documento de Cloud Storage
2. Se activa la Cloud Function mediante un evento de eliminación
3. Se eliminan las referencias al documento en Redis
4. Se eliminan los datapoints correspondientes del índice de Vector Search

## Operaciones Principales con Redis Vector Search

El módulo `vector_search.py` proporciona las siguientes operaciones principales:

### Indexación de Contenido

```python
# Indexar páginas de un documento
index_pages(index_name, filename, pages, embeddings)
```

Este proceso:
1. Crea el índice si no existe
2. Genera un documento para cada página con su texto y embedding
3. Carga los documentos en el índice Redis Vector Search


### Eliminación de Documentos

```python
# Eliminar todos los datapoints de un documento
remove_datapoints(index_name, filename, page_count)
```

Este proceso:
1. Busca todas las claves en Redis con el prefijo del índice
2. Filtra las que corresponden al filename especificado
3. Elimina las claves encontradas

