# Módulo de Almacenamiento

Este módulo proporciona una integración robusta con Google Cloud Storage.

## Características

- 🚀 Integración completa con Google Cloud Storage
- 📁 Gestión de archivos (subida, descarga, eliminación)
- 🏷️ Manejo de metadatos
- 🔍 Listado de archivos
- 💪 Indicador de salud integrado
- ⚡ Soporte para streams



## Configuración

### Variables de Entorno Requeridas

```env
GOOGLE_CLOUD_PROJECT_ID=tu-proyecto-id
GOOGLE_CLOUD_STORAGE_BUCKET=tu-bucket-nombre
GOOGLE_CREDENTIALS={"type": "service_account", ...}
```


## Uso

### Inyección del Servicio

```typescript
constructor(private readonly storageService: StorageService) {}
```

### Métodos Disponibles

#### Guardar Archivo

```typescript
const result = await this.storageService.save(
  'ruta/archivo.pdf',
  'application/pdf',
  buffer,
  [{ autor: 'Juan' }]
);
```

#### Obtener Archivo

```typescript
const file = await this.storageService.get('ruta/archivo.pdf');
```

#### Obtener Archivo con Metadatos

```typescript
const file = await this.storageService.getWithMetaData('ruta/archivo.pdf');
```

#### Eliminar Archivo

```typescript
const deleted = await this.storageService.delete('ruta/archivo.pdf');
```

#### Listar Archivos

```typescript
const files = await this.storageService.listFiles('ruta/');
```

#### Actualizar Metadatos

```typescript
await this.storageService.setMetadata('ruta/archivo.pdf', {
  autor: 'Juan',
  version: '2.0'
});
```

## Monitoreo de Salud

El módulo incluye un indicador de salud que puede integrarse con el módulo Terminus de NestJS:

```typescript
@Controller('health')
export class HealthController {
  constructor(private storage: StorageHealthIndicator) {}

  @Get()
  @HealthCheck()
  check() {
    return this.storage.isHealthy('storage');
  }
}
```
