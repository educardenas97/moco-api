# Módulo de Analytics Q&A

## Descripción

Este módulo proporciona funcionalidades completas para el seguimiento, análisis y gestión de consultas Q&A (Preguntas y Respuestas) en el sistema MOCO-API. Permite registrar automáticamente todas las interacciones de usuarios con el sistema de recuperación de documentos y consultas legales.

## Características Principales

- **📊 Registro Automático**: Captura automáticamente todas las consultas y respuestas
- **🔍 Analytics Avanzados**: Estadísticas detalladas sobre uso del sistema
- **📈 Métricas de Performance**: Tiempos de respuesta y análisis de rendimiento
- **🗄️ Almacenamiento Escalable**: Utiliza MongoDB para almacenamiento eficiente
- **🔄 Interceptor Transparente**: Registra datos sin afectar la funcionalidad existente

## Arquitectura

### Componentes Principales

1. **QAService**: Servicio principal para operaciones CRUD de registros Q&A
2. **QALoggingInterceptor**: Interceptor que captura automáticamente las interacciones
3. **MongoDBProvider**: Proveedor de conexión a MongoDB
4. **QAAnalyticsController**: Controlador REST para consultas de analytics
5. **MongoDBHealthIndicator**: Indicador de salud para MongoDB

### Flujo de Datos

```
Usuario → Consulta → RetrievalController → QALoggingInterceptor → QAService → MongoDB
                                     ↓
                              Respuesta registrada automáticamente
```

## Configuración

### Variables de Entorno

```env
# Configuración de MongoDB
MONGODB_URL=mongodb://usuario:contraseña@host:puerto/database
```

Si no se proporciona `MONGODB_URL`, se utilizará `mongodb://localhost:27017/moco-api` por defecto.

### Instalación de Dependencias

El módulo requiere las siguientes dependencias que ya están instaladas:

```bash
yarn add mongoose
```

## Estructura de Datos

### Esquema Q&A

Cada registro Q&A contiene:

```typescript
{
  query: string;              // Pregunta del usuario
  answer: string;             // Respuesta generada
  sources: Array<{            // Documentos fuente
    title: string;
    content: string;
    score: number;
    metadata: any;
  }>;
  metadata: {                 // Metadata del proceso
    responseTime: number;     // Tiempo de respuesta en ms
    timestamp: Date;          // Momento de la consulta
    documentType?: string;    // Tipo de documento (opcional)
    userId?: string;          // ID del usuario (opcional)
    endpoint: string;         // Endpoint utilizado
  };
  createdAt: Date;           // Fecha de creación
  updatedAt: Date;           // Fecha de actualización
}
```

### Índices MongoDB

Para optimizar las consultas, se crean los siguientes índices:

- `metadata.timestamp`: Ordenamiento por fecha
- `query`: Búsqueda de texto en consultas
- `metadata.endpoint`: Filtrado por endpoint
- `metadata.userId`: Filtrado por usuario

## API Endpoints

### GET /analytics/qa/records

Obtiene registros de consultas Q&A con filtros opcionales.

#### Parámetros de Query

- `limit` (number, opcional): Límite de resultados (default: 50)
- `skip` (number, opcional): Número de registros a omitir (default: 0)
- `userId` (string, opcional): Filtrar por ID de usuario
- `endpoint` (string, opcional): Filtrar por endpoint
- `dateFrom` (string, opcional): Fecha de inicio (ISO string)
- `dateTo` (string, opcional): Fecha de fin (ISO string)
- `searchQuery` (string, opcional): Búsqueda de texto en consultas

#### Ejemplo de Uso

```bash
curl -X GET "http://localhost:4001/analytics/qa/records?limit=10&endpoint=/retrieval/legal-query" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /analytics/qa/stats

Obtiene estadísticas agregadas de las consultas Q&A.

#### Parámetros de Query

- `userId` (string, opcional): Filtrar por ID de usuario
- `endpoint` (string, opcional): Filtrar por endpoint
- `dateFrom` (string, opcional): Fecha de inicio
- `dateTo` (string, opcional): Fecha de fin

#### Respuesta de Ejemplo

```json
{
  "success": true,
  "data": {
    "totalQueries": 1250,
    "averageResponseTime": 1847.5,
    "topQueries": [
      {
        "query": "¿Cómo constituir una empresa?",
        "count": 45
      }
    ],
    "querysByEndpoint": [
      {
        "endpoint": "/retrieval/legal-query",
        "count": 890
      }
    ]
  }
}
```

### GET /analytics/qa/cleanup

Limpia registros antiguos de Q&A.

#### Parámetros de Query

- `olderThanDays` (number, opcional): Días de antigüedad para eliminar (default: 90)

## Interceptor QALoggingInterceptor

### Funcionamiento

El interceptor se ejecuta automáticamente en los siguientes endpoints:

- `RetrievalController.queryLegalDocuments`
- `RetrievalController.getRetrieval`

### Datos Capturados

1. **Consulta**: Extrae el campo `query` del request body
2. **Respuesta**: Captura la respuesta generada por el sistema
3. **Fuentes**: Registra los documentos utilizados como fuente
4. **Metadata**: Incluye tiempo de respuesta, endpoint y usuario

### Extracción de Usuario

El interceptor intenta extraer el ID de usuario de:
- `request.user.id` (si está disponible)
- `request.headers['user-id']` (header personalizado)

## Uso en el Código

### Inyección del Servicio QA

```typescript
import { QAService } from '../providers/qa.service';

@Injectable()
export class MyService {
  constructor(private readonly qaService: QAService) {}

  async getAnalytics() {
    const stats = await this.qaService.getQAStats({
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date()
    });
    
    return stats;
  }
}
```

### Registro Manual de Q&A

```typescript
await this.qaService.saveQARecord({
  query: 'Mi consulta personalizada',
  answer: 'Respuesta personalizada',
  sources: [/* documentos */],
  metadata: {
    responseTime: 1200,
    endpoint: '/custom-endpoint',
    userId: 'user123'
  }
});
```

## Monitoreo y Salud

### Health Check

El sistema incluye un indicador de salud para MongoDB que se puede verificar en:

```
GET /health
```

La respuesta incluirá el estado de MongoDB junto con otros servicios:

```json
{
  "success": true,
  "data": {
    "services": [
      { "name": "storage", "status": "ok" },
      { "name": "retrieval", "status": "ok" },
      { "name": "mongodb", "status": "ok" }
    ]
  }
}
```

### Limpieza Automática

Se recomienda configurar una tarea programada para limpiar registros antiguos:

```typescript
// Eliminar registros de más de 90 días
await this.qaService.cleanupOldRecords(90);
```

## Mejores Prácticas

1. **Filtrado de Datos Sensibles**: Evitar registrar información personal sensible
2. **Limpieza Periódica**: Configurar limpieza automática de registros antiguos
3. **Índices Optimizados**: Mantener índices MongoDB actualizados para consultas rápidas
4. **Monitoreo de Performance**: Vigilar tiempos de respuesta del sistema de logging
5. **Backup Regular**: Realizar backups regulares de los datos de analytics

## Troubleshooting

### Error de Conexión a MongoDB

```
❌ Error de conexión a MongoDB: MongoNetworkError
```

**Solución**: Verificar la variable `MONGODB_URL` y la conectividad de red.

### Interceptor No Registra Datos

**Posibles Causas**:
- El endpoint no está en la lista de endpoints monitoreados
- Error en la estructura de la respuesta
- Fallo en la conexión a MongoDB

**Solución**: Revisar logs del servidor y verificar la configuración del interceptor.

### Performance Lenta en Consultas

**Solución**: 
- Verificar que los índices MongoDB estén creados
- Considerar aumentar el pool de conexiones
- Implementar paginación en consultas grandes

## Roadmap

### Funcionalidades Futuras

- [ ] Dashboard web para analytics
- [ ] Alertas automáticas por uso anómalo
- [ ] Exportación de datos a formatos CSV/Excel
- [ ] Integración con sistemas de monitoreo externos
- [ ] Analytics predictivos con ML
- [ ] Métricas de satisfacción del usuario
