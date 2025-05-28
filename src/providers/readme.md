# Proveedores (Providers)

## Descripción

Este directorio contiene proveedores de servicios compartidos que pueden ser utilizados por múltiples módulos en la aplicación. Los proveedores son componentes reutilizables que encapsulan la lógica de conexión con servicios externos y pueden ser inyectados en cualquier módulo que los requiera.

## Proveedores Disponibles

### RedisProvider

Proporciona una conexión compartida a Redis para ser utilizada por diferentes módulos que requieren acceso a esta base de datos.

#### Características

- Conexión automática al servidor Redis configurado
- Reintentos automáticos en caso de fallo de conexión (máximo 5 intentos)
- Timeouts configurables
- Manejo de errores y registro de eventos

#### Configuración

El proveedor utiliza las siguientes variables de entorno:

```
REDIS_URL=redis://usuario:contraseña@host:puerto  # URL de conexión a Redis
REDIS_CONNECT_TIMEOUT=10000                       # Timeout de conexión en milisegundos (opcional)
```

Si no se proporciona `REDIS_URL`, se utilizará `redis://localhost:6379` por defecto.

#### Uso

Para utilizar el proveedor en un módulo:

```typescript
import { Module } from '@nestjs/common';
import { RedisProvider } from '../providers/redis.provider';

@Module({
  providers: [
    RedisProvider,
    // Otros proveedores...
  ],
  exports: [
    'REDIS_CLIENT',  // Exportar el token para que otros módulos puedan inyectar el cliente
  ],
})
export class MyModule {}
```

Para inyectar el cliente Redis en un servicio:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class MyService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: RedisClientType,
  ) {}

  async getValue(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }
}
```

## Estrategia de reconexión

El proveedor implementa una estrategia de reconexión exponencial que:

1. Intenta reconectarse con un retraso incremental entre intentos
2. Limita el retraso máximo a 5 segundos
3. Falla después de 5 intentos fallidos

## Manejo de errores

El proveedor registra todos los errores de conexión en la consola y termina el proceso después de 5 intentos fallidos de reconexión. Esto permite que los sistemas de orquestación (como Kubernetes) puedan reiniciar el contenedor automáticamente.

### MongoDBProvider

Proporciona una conexión compartida a MongoDB para el almacenamiento de datos de Q&A y analytics.

#### Características

- Conexión automática al servidor MongoDB configurado
- Manejo de reconexión automática
- Pool de conexiones optimizado
- Monitoreo del estado de conexión
- Shutdown graceful

#### Configuración

El proveedor utiliza las siguientes variables de entorno:

```
MONGODB_URL=mongodb://usuario:contraseña@host:puerto/database  # URL de conexión a MongoDB
```

Si no se proporciona `MONGODB_URL`, se utilizará `mongodb://localhost:27017/moco-api` por defecto.

#### Uso

Para utilizar el proveedor en un módulo:

```typescript
import { Module } from '@nestjs/common';
import { MongoDBProvider } from '../providers/mongodb.provider';

@Module({
  providers: [
    MongoDBProvider,
    // Otros proveedores...
  ],
  exports: [
    'MONGODB_CONNECTION',  // Exportar el token para que otros módulos puedan inyectar la conexión
  ],
})
export class MyModule {}
```

Para inyectar la conexión MongoDB en un servicio:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import mongoose from 'mongoose';

@Injectable()
export class MyService {
  constructor(
    @Inject('MONGODB_CONNECTION')
    private readonly mongoConnection: typeof mongoose,
  ) {}

  async findDocuments(): Promise<any[]> {
    const model = this.mongoConnection.model('MyModel', mySchema);
    return model.find().exec();
  }
}
```

## Servicios Q&A

### QAService

Servicio especializado para el manejo de registros de consultas y respuestas (Q&A).

#### Funcionalidades

- **Registro automático de Q&A**: Guarda consultas, respuestas, fuentes y metadata
- **Consulta de históricos**: Búsqueda y filtrado de registros anteriores
- **Estadísticas**: Métricas agregadas sobre uso del sistema
- **Limpieza automática**: Eliminación de registros antiguos

#### Esquema de datos

Los registros Q&A incluyen:

- `query`: Pregunta realizada por el usuario
- `answer`: Respuesta generada por el sistema
- `sources`: Documentos fuente utilizados para la respuesta
- `metadata`: Información adicional (tiempo de respuesta, endpoint, usuario, etc.)

#### Uso básico

```typescript
// Registrar una nueva consulta Q&A
await this.qaService.saveQARecord({
  query: '¿Qué es una sociedad anónima?',
  answer: 'Una sociedad anónima es...',
  sources: [...documentos],
  metadata: {
    responseTime: 1500,
    endpoint: '/retrieval/legal-query',
    userId: 'user123'
  }
});

// Obtener estadísticas
const stats = await this.qaService.getQAStats({
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date()
});
```
