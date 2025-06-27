<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Módulo de conocimientos (MOCO-API)

## Descripción

API basada en NestJS para la recuperación de documentos y contenido basado en vectores. Este proyecto permite buscar documentos relevantes utilizando tecnologías de embeddings y almacenamiento vectorial, proporcionando una interfaz robusta para sistemas de preguntas y respuestas con contexto documental.

## Características Principales

- **Recuperación de Documentos:** Búsqueda semántica basada en vectores utilizando Redis o Vertex AI
- **Procesamiento de Embeddings:** Integración con OpenAI y Google Generative AI
- **Almacenamiento de Archivos:** Gestión de documentos en Google Cloud Storage
- **Autenticación:** Protección de endpoints mediante tokens Bearer
- **Escalabilidad:** Arquitectura modular basada en NestJS

## Estructura del Proyecto

El proyecto está organizado en módulos funcionales, cada uno con su propia documentación detallada:

- **Módulo de Recuperación**: Servicios para buscar documentos relevantes basados en consultas utilizando Redis o Vertex AI
- **Módulo de Almacenamiento**: Gestión de archivos en Google Cloud Storage
- **Módulo de Autenticación**: Validación de tokens Bearer y seguridad de endpoints
- **Módulo de Media**: Administración de archivos multimedia y uploads
- **Módulo de Analytics**: Sistema de seguimiento y análisis de consultas Q&A con MongoDB
- **Módulo de Proveedores**: Servicios compartidos como conexiones a Redis y MongoDB
- **Health Checks**: Monitoreo del estado de los servicios críticos

> Cada módulo tiene su propio archivo README.md con documentación detallada sobre su funcionalidad específica.

## Configuración Inicial

### Requisitos Previos

- Node.js (v14 o superior)
- Yarn 
- Redis (para almacenamiento de vectores)
- Cuenta en Google Cloud Platform (para almacenamiento)
- Cuenta en OpenAI (para embeddings)

### Instalación

```bash
# Instalar dependencias
$ yarn install
```

### Variables de Entorno

La aplicación requiere configurar las siguientes variables de entorno en un archivo `.env` en la raíz del proyecto:

```
# Configuración General
PORT=4001                           # Puerto donde se ejecutará la aplicación
TZ=America/Buenos_Aires             # Zona horaria para la aplicación
CACHE_TTL=3600                      # Tiempo de vida de la caché en segundos

# Autenticación
VALID_TOKENS=                       # Lista de tokens válidos separados por comas

# Configuración de Redis
REDIS_URL=                          # URL de conexión a Redis (ej: redis://usuario:contraseña@host:puerto)
REDIS_VECTOR_INDEX=docs_embed       # Nombre del índice vectorial en Redis

# Servicio de Embeddings
OPENAI_API_KEY=                     # Clave API de OpenAI para embeddings
EMBEDDING_PROVIDER=openai           # Proveedor de embeddings (openai o google)
RETRIEVAL_SERVICE_TYPE=redis        # Tipo de servicio de recuperación (redis o vertex)

# Configuración de LLM (Large Language Models)
LLM_PROVIDER=openai                 # Proveedor de LLM por defecto (openai o anthropic)
ANTHROPIC_API_KEY=                  # Clave API de Anthropic Claude


# Modelos disponibles por proveedor (separados por comas)
OPENAI_MODELS=o4-mini,gpt-4.1,gpt-4-turbo,gpt-4o,gpt-4o-mini,gpt-3.5-turbo
ANTHROPIC_MODELS=claude-3-5-sonnet-20241022,claude-3-5-haiku-20241022,claude-3-opus-20240229

# Configuración de Vertex AI (si RETRIEVAL_SERVICE_TYPE=vertex)
GOOGLE_VERTEXAI_MATCHINGENGINE_INDEX=       # ID del índice de Vertex AI Matching Engine
GOOGLE_VERTEXAI_MATCHINGENGINE_INDEXENDPOINT= # Endpoint del índice de Vertex AI
GOOGLE_VERTEXAI_API_ENDPOINT=                # Endpoint de la API de Vertex AI

# Configuración de Almacenamiento (para Google Cloud Storage)
GCP_PROJECT_ID=                     # ID del proyecto de Google Cloud
GOOGLE_CLOUD_STORAGE_BUCKET=        # Nombre del bucket de Google Cloud Storage
GOOGLE_CREDENTIALS=                 # Cadena JSON con las credenciales de Google Cloud
GOOGLE_CREDENTIALS_PATH=            # Ruta al archivo de credenciales de Google Cloud (alternativa a GOOGLE_CREDENTIALS)
GOOGLE_API_KEY=                     # Clave API de Google (si se usa Google Generative AI)

# Configuración de MongoDB (para Analytics Q&A)
MONGODB_URL=mongodb://localhost:27017/moco-api  # URL de conexión a MongoDB
```

> Nota: La configuración específica dependerá de los servicios que desees utilizar (Redis o Vertex AI para recuperación, OpenAI o Google para embeddings).

## Ejecución del Proyecto

```bash
# Modo desarrollo
$ yarn run start

# Modo desarrollo con recarga automática
$ yarn run start:dev

# Modo producción
$ yarn run start:prod
```

## Pruebas

```bash
# Pruebas unitarias
$ yarn run test

# Pruebas end-to-end
$ yarn run test:e2e

# Cobertura de pruebas
$ yarn run test:cov
```

## Despliegue

Para desplegar la aplicación en un entorno de producción, recomendamos utilizar contenedores Docker. El proyecto incluye un Dockerfile configurado para producción.

```bash
# Construir la imagen Docker
$ docker build -t moco-api .

# Ejecutar el contenedor
$ docker run -p 4001:4001 --env-file .env moco-api
```

También puede utilizar el archivo de configuración de Kubernetes incluido para desplegar en un clúster.

## Uso de la API

### Consultas Legales con LLM

La API proporciona un endpoint especializado para realizar consultas legales utilizando modelos de lenguaje (LLM) con contexto de documentos jurídicos:

```http
POST /retrieval/legal-query
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "¿Cuáles son los requisitos para constituir una empresa en Paraguay?",
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022"
}
```

**Parámetros:**
- `query` (requerido): La consulta legal a realizar
- `provider` (opcional): Proveedor de LLM (`openai` o `anthropic`)
- `model` (opcional): Modelo específico a utilizar

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "answer": "Para constituir una empresa en Paraguay...",
    "sources": [
      {
        "title": "Ley N° 1034/83 del Comerciante",
        "content": "...",
        "score": 0.95
      }
    ]
  }
}
```

### Modelos Disponibles

Obtiene la lista de modelos disponibles para cada proveedor:

```http
GET /retrieval/models
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "openai": ["gpt-4.1", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini"],
    "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"]
  }
}
```

## Arquitectura

La API sigue los principios de arquitectura hexagonal, separando la lógica de negocio de las implementaciones concretas mediante interfaces y factorías. Esto permite cambiar fácilmente entre diferentes proveedores de embeddings o soluciones de almacenamiento vectorial sin modificar la lógica principal.

### Módulos Principales

Cada módulo tiene su propia documentación detallada en su archivo `readme.md`:

- **[Módulo de Recuperación](/src/retrieval/readme.md)**: Búsqueda de documentos relevantes utilizando vectores
- **[Módulo de Autenticación](/src/auth/readme.md)**: Protección de endpoints con tokens Bearer
- **[Módulo de Almacenamiento](/src/storage/readme.md)**: Gestión de archivos en Google Cloud Storage
- **[Módulo de Media](/src/media/readme.md)**: Subida y gestión de archivos multimedia
- **[Módulo de Analytics](/src/analytics/readme.md)**: Sistema de seguimiento y análisis de consultas Q&A
- **[Módulo de Proveedores](/src/providers/readme.md)**: Servicios compartidos como Redis y MongoDB
- **[Health Checks](/src/health/readme.md)**: Monitoreo del estado de los servicios

### Diagrama de Componentes

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│     Auth      │     │    Health     │     │     Media     │
│    Module     │     │   Controller  │     │    Module     │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        v                     v                     v
┌─────────────────────────────────────────────────────────┐
│                       App Module                        │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
┌─────────▼──────────┐         ┌─────────▼──────────┐
│     Retrieval      │         │      Storage       │
│      Module        │         │      Module        │
└─────────┬──────────┘         └─────────┬──────────┘
          │                               │
┌─────────▼──────────┐         ┌─────────▼──────────┐
│    Providers       │         │     GCP/Cloud      │
│    (Redis, etc)    │◄────────►     Services       │
└────────────────────┘         └────────────────────┘
```

## Health Checks

La aplicación incluye endpoints de monitoreo para verificar el estado de los servicios críticos:

```
GET /health - Verifica todos los servicios (almacenamiento y recuperación)
```

## Contribución

Para contribuir al proyecto, por favor revise las guías de contribución y asegúrese de seguir las convenciones de código establecidas.

## Licencia

Este proyecto se distribuye bajo la licencia MIT.
