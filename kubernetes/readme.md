# Guía de Implementación y Despliegue del Proyecto MOCO API

## Requisitos Previos

1. **Cuenta de Google Cloud Platform (GCP)**:
   - Proyecto creado en GCP con Firestore y Cloud Storage habilitados.
   - Service Account con permisos para:
     - Firestore: `Cloud Datastore User`.
     - Cloud Storage: `Storage Object Admin`.
     - Vertex AI: Según los recursos usados (ej: `aiplatform.user`).
   - Archivo JSON de credenciales del Service Account (ej: `google-credentials.json`).

2. **Infraestructura**:
   - Cluster de Kubernetes 
   - CLI `kubectl` instalado y configurado para acceder al cluster.
   - Docker instalado localmente para construir imágenes.
   - Acceso a un registro de contenedores (OCI Container Registry).

3. **Credenciales y Claves**:
   - Archivo `google-credentials.json` del Service Account de GCP.
   - API Key de Google (para acceso a los modelos).
   - Variables de entorno del proyecto (ver [.env de ejemplo](#anexo-ejemplo-de-env)).



---

## Preparación

### 1. Configurar Credenciales de Google Cloud
- Guarda el JSON del Service Account en `./secrets/google-credentials.json`.
- Ejemplo de estructura del archivo:
  ```json
  {
    "type": "service_account",
    "project_id": "tu-project-id",
    "private_key_id": "...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "...",
    "client_id": "...",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "..."
  }
    ```

###  2. Crear ConfigMap y Secrets en Kubernetes
- ConfigMap (variables no sensibles):

```bash
kubectl create configmap moco-api-config \
  --from-literal=PORT=4001 \
  --from-literal=TZ=America/Asuncion \
  --from-literal=CACHE_TTL=3600 \
  --from-literal=GCP_PROJECT_ID="" \
  --from-literal=GOOGLE_VERTEXAI_MATCHINGENGINE_INDEX="" \
  --from-literal=GOOGLE_VERTEXAI_MATCHINGENGINE_INDEXENDPOINT="" \
  --from-literal=GOOGLE_VERTEXAI_API_ENDPOINT="" \
  --from-literal=GOOGLE_CLOUD_STORAGE_BUCKET=""
```
- Secret (variables sensibles):

```bash
kubectl create secret generic moco-api-secret   --from-literal=GOOGLE_API_KEY="INSERTAR API_KEY"   --from-file=GOOGLE_CREDENTIALS=./secrets/google-credentials.json  --from-literal=REDIS_URL="INSERTAR URL"  --from-literal=REDIS_VECTOR_INDEX="docs_embed" --from-literal=VALID_TOKENS=eyJhbGciOiJIUzI1NiJ9.user1.abc123xyz456
```

### 3. Pasos de Despliegue
1. Construir y Subir la Imagen del Proyecto
```bash
docker build -t localhost:5000/moco-api .
docker push localhost:5000/moco-api
```
2. Aplicar los Manifiestos de Kubernetes
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```