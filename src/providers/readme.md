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
