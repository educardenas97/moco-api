# Módulo `retrieval`

Este módulo está diseñado para realizar la recuperación de documentos relevantes basados en una pregunta del usuario y generar respuestas inteligentes utilizando modelos de lenguaje (LLM). Utiliza el patrón de diseño Factory Method para desacoplar la lógica principal de recuperación de las implementaciones concretas de los servicios de embedding, recuperación de documentos, acceso al contenido de los documentos y generación de respuestas con LLM.

## Características Principales

- **Recuperación de Documentos**: Búsqueda semántica de documentos utilizando embeddings vectoriales
- **Consultas Legales Inteligentes**: Generación de respuestas a consultas legales usando LLM con contexto documental
- **Múltiples Proveedores de LLM**: Soporte para OpenAI (GPT-4, etc.) y Anthropic Claude
- **Plantillas de Prompts Centralizadas**: Sistema unificado de instrucciones y prompts para consultas legales
- **Configuración Flexible**: Selección dinámica de proveedores y modelos mediante variables de entorno
- **Validación de Modelos**: Verificación automática de compatibilidad entre proveedores y modelos

## Estructura del Directorio

La estructura del directorio del módulo `retrieval` se organiza de la siguiente manera para mantener una clara separación de responsabilidades y facilitar la mantenibilidad:

```bash
retrieval/
├── retrieval.controller.ts
├── retrieval.controller.spec.ts
├── retrieval.module.ts
├── retrieval.service.ts
├── retrieval.service.spec.ts
├── retrieval.health.ts
├── dto/
│   ├── index.ts
│   ├── retrieval-request.dto.ts
│   ├── retrieval-response.dto.ts
│   ├── legal-query-request.dto.ts
│   └── legal-query-response.dto.ts
├── embedding/
│   ├── embedding-service.factory.ts
│   ├── embedding-service.interface.ts
│   ├── google-generative-ai-embedding.service.ts
│   └── openai-embedding.service.ts
├── document-retrieval/
│   ├── document-retrieval-service.factory.ts
│   ├── document-retrieval-service.interface.ts
│   ├── redis-retrieval.service.ts
│   └── vertex-ai-matching-engine-retrieval.service.ts
├── document-content/
│   ├── document-content-service.factory.ts
│   ├── document-content-service.interface.ts
│   ├── firestore-document-content.service.ts
│   └── redis-document-content.service.ts
└── llm/
    ├── llm-service.factory.ts
    ├── llm-service.interface.ts
    ├── llm.config.ts
    ├── legal-prompt-templates.ts
    ├── openai-llm.service.ts
    └── claude-llm.service.ts
```

*   **`retrieval.controller.ts`**: Controlador NestJS que expone los endpoints de la API relacionados con la recuperación de documentos.

*   **`retrieval.service.ts`**: Servicio principal que orquesta el proceso de recuperación de documentos, utilizando las factorías para obtener implementaciones específicas de servicios.

*   **`retrieval.health.ts`**: Indicador de salud para monitorear el estado del servicio de recuperación.

*   **`dto/`**: Define los Data Transfer Objects (DTOs) utilizados en el módulo.
    *   `retrieval-request.dto.ts`: Define la estructura del DTO para las peticiones al servicio de recuperación.
    *   `retrieval-response.dto.ts`: Define la estructura de respuesta para las operaciones de recuperación.
    *   `legal-query-request.dto.ts`: Define la estructura del DTO para consultas legales con LLM.
    *   `legal-query-response.dto.ts`: Define la estructura de respuesta para consultas legales.

*   **`embedding/`**: Servicios relacionados con la generación de embeddings de texto.
    *   `embedding-service.interface.ts`: Define la interfaz `EmbeddingService` con el contrato para los servicios de embedding.
    *   `google-generative-ai-embedding.service.ts`: Implementación que utiliza la API de Google Generative AI (modelo `text-embedding-004`).
    *   `openai-embedding.service.ts`: Implementación que utiliza la API de OpenAI (modelo `text-embedding-3-small`).
    *   `embedding-service.factory.ts`: Factory que crea instancias del servicio apropiado según la configuración.

*   **`document-retrieval/`**: Servicios para la recuperación de documentos relevantes basados en similitud vectorial.
    *   `document-retrieval-service.interface.ts`: Define la interfaz para los servicios de recuperación.
    *   `redis-retrieval.service.ts`: Implementación que utiliza Redis para búsqueda vectorial.
    *   `vertex-ai-matching-engine-retrieval.service.ts`: Implementación que utiliza Vertex AI Matching Engine.
    *   `document-retrieval-service.factory.ts`: Factory que selecciona la implementación según la configuración.

*   **`document-content/`**: Servicios para acceder al contenido de los documentos almacenados.
    *   `document-content-service.interface.ts`: Define la interfaz para los servicios de contenido.
    *   `firestore-document-content.service.ts`: Implementación que recupera el contenido desde Firestore.
    *   `redis-document-content.service.ts`: Implementación que recupera el contenido desde Redis.
    *   `document-content-service.factory.ts`: Factory que selecciona la implementación según la configuración.

*   **`llm/`**: Servicios para la generación de respuestas utilizando modelos de lenguaje (LLM).
    *   `llm-service.interface.ts`: Define la interfaz `LLMService` con el contrato para los servicios de LLM.
    *   `openai-llm.service.ts`: Implementación que utiliza los modelos de OpenAI (GPT-4, etc.).
    *   `claude-llm.service.ts`: Implementación que utiliza los modelos de Anthropic Claude.
    *   `llm-service.factory.ts`: Factory que crea instancias del servicio de LLM según el proveedor.
    *   `llm.config.ts`: Configuración de modelos disponibles para cada proveedor.
    *   `legal-prompt-templates.ts`: Plantillas centralizadas de prompts e instrucciones para consultas legales.

    ## Endpoints Disponibles

### Recuperación de Documentos
- **POST `/retrieval`**: Recupera documentos relevantes basados en una consulta.
- **GET `/retrieval/topics`**: Obtiene los tópicos disponibles para consultas.

### Consultas Legales con LLM
- **POST `/retrieval/legal-query`**: Realiza una consulta legal utilizando un LLM y documentos jurídicos.
  - Parámetros:
    - `query` (requerido): La consulta legal a realizar
    - `provider` (opcional): Proveedor de LLM (`openai` o `anthropic`)
    - `model` (opcional): Modelo específico a utilizar

- **GET `/retrieval/models`**: Obtiene los modelos disponibles para cada proveedor LLM.

    ## Configuración

El módulo de recuperación ofrece flexibilidad para utilizar diferentes servicios de recuperación y embedding a través de variables de entorno:

### Configuración de Servicio de Recuperación

- `RETRIEVAL_SERVICE_TYPE`: Define el servicio de recuperación de documentos a utilizar:
  - `redis`: Utiliza Redis para almacenamiento y búsqueda vectorial
  - `vertex`: Utiliza Vertex AI Matching Engine de Google Cloud

### Configuración para Redis
Si `RETRIEVAL_SERVICE_TYPE=redis` se deben configurar estas variables:
- `REDIS_URL`: URL de conexión a Redis (ej: redis://usuario:contraseña@host:puerto)
- `REDIS_VECTOR_INDEX`: Nombre del índice vectorial en Redis

### Configuración para Vertex AI
Si `RETRIEVAL_SERVICE_TYPE=vertex` se deben configurar estas variables:
- `GOOGLE_VERTEXAI_MATCHINGENGINE_INDEX`: ID del índice de Vertex AI
- `GOOGLE_VERTEXAI_MATCHINGENGINE_INDEXENDPOINT`: Endpoint del índice de Vertex AI
- `GOOGLE_VERTEXAI_API_ENDPOINT`: Endpoint de la API de Vertex AI
- `GCP_PROJECT_ID`: ID del proyecto de Google Cloud

### Configuración de Proveedores de Embedding

- `EMBEDDING_PROVIDER`: Define el proveedor de embedding a utilizar:
  - `google`: Utiliza la API de Google Generative AI (modelo `text-embedding-004`)
  - `openai`: Utiliza la API de OpenAI (modelo `text-embedding-3-small`)

- Variables específicas para cada proveedor:
  - Google: `GOOGLE_API_KEY` 
  - OpenAI: `OPENAI_API_KEY`

### Configuración de Modelos de Lenguaje (LLM)

- `LLM_PROVIDER`: Define el proveedor de LLM por defecto:
  - `openai`: Utiliza los modelos de OpenAI (GPT-4, etc.)
  - `anthropic`: Utiliza los modelos de Anthropic Claude

- Variables específicas para cada proveedor:
  - **OpenAI**: 
    - `OPENAI_API_KEY`: Clave API de OpenAI
    - `OPENAI_MODELS`: Lista de modelos disponibles separados por comas
  - **Anthropic**: 
    - `ANTHROPIC_API_KEY`: Clave API de Anthropic
    - `ANTHROPIC_MODELS`: Lista de modelos disponibles separados por comas

Ejemplo de configuración:
```env
# Configuración de LLM
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
OPENAI_MODELS=o4-mini,gpt-4.1,gpt-4-turbo,gpt-4o

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODELS=claude-3-5-sonnet-20241022,claude-3-5-haiku-20241022
```

## Ejemplos de Uso

### Consulta Legal con OpenAI
```http
POST /retrieval/legal-query
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "¿Cuáles son los requisitos para constituir una empresa en Paraguay?",
  "provider": "openai",
  "model": "o4-mini"
}
```

### Consulta Legal con Claude
```http
POST /retrieval/legal-query
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "¿Qué dice la legislación sobre el derecho laboral?",
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022"
}
```

### Obtener Modelos Disponibles
```http
GET /retrieval/models
Authorization: Bearer <token>
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "openai": ["o4-mini", "gpt-4.1", "gpt-4-turbo"],
    "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"]
  }
}
```

## Arquitectura de Prompts

El módulo utiliza un sistema centralizado de plantillas de prompts (`legal-prompt-templates.ts`) que:

- **Estandariza las instrucciones**: Garantiza consistencia entre diferentes proveedores de LLM
- **Facilita el mantenimiento**: Cambios en una sola ubicación se reflejan en todos los servicios
- **Personaliza según contexto**: Adapta instrucciones basándose en el país de legislación
- **Formatea documentos**: Estructura uniforme para el contexto documental

### Ejemplo de Plantilla de Sistema
```typescript
// Mensaje generado automáticamente
"Eres un asesor legal experto que responde con precisión y claridad, 
citando las fuentes legales correspondientes. 
Tu conocimiento se centra en la legislación paraguaya."
```

