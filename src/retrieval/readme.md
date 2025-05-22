# Módulo `retrieval`

Este módulo está diseñado para realizar la recuperación de documentos relevantes basados en una pregunta del usuario.  Utiliza el patrón de diseño Factory Method para desacoplar la lógica principal de recuperación de las implementaciones concretas de los servicios de embedding, recuperación de documentos y acceso al contenido de los documentos.

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
│   └── retrieval-response.dto.ts
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
└── document-content/
    ├── document-content-service.factory.ts
    ├── document-content-service.interface.ts
    ├── firestore-document-content.service.ts
    └── redis-document-content.service.ts
```

*   **`retrieval.controller.ts`**: Controlador NestJS que expone los endpoints de la API relacionados con la recuperación de documentos.

*   **`retrieval.service.ts`**: Servicio principal que orquesta el proceso de recuperación de documentos, utilizando las factorías para obtener implementaciones específicas de servicios.

*   **`retrieval.health.ts`**: Indicador de salud para monitorear el estado del servicio de recuperación.

*   **`dto/`**: Define los Data Transfer Objects (DTOs) utilizados en el módulo.
    *   `retrieval-request.dto.ts`: Define la estructura del DTO para las peticiones al servicio de recuperación.
    *   `retrieval-response.dto.ts`: Define la estructura de respuesta para las operaciones de recuperación.

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

