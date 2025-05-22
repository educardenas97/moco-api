# Módulo Media

## Descripción
Este módulo proporciona funcionalidades para la gestión de archivos multimedia (imágenes, documentos, archivos binarios, etc.) en la aplicación. Permite la carga, descarga, listado y eliminación de archivos, utilizando el servicio de almacenamiento configurado (Google Cloud Storage).

## Características

- 📤 Carga de archivos multimedia con metadatos personalizados
- 📥 Descarga de archivos por ID
- 📋 Listado de archivos disponibles
- 🗑️ Eliminación de archivos
- 🏷️ Soporte para metadatos personalizados

## Estructura

```
media/
├── media.controller.ts      # Controlador con los endpoints de la API
├── media.controller.spec.ts # Tests del controlador
├── media.module.ts          # Módulo NestJS para Media
├── dto/
│   ├── index.ts             # Exportaciones de DTOs
│   ├── media.dto.ts         # DTO para respuestas de Media
│   └── upload.dto.ts        # DTO para la carga de archivos
```

## API Endpoints

### POST `/media`
Carga un archivo multimedia al almacenamiento.

**Parámetros**:
- `file`: Archivo binario a subir (multipart/form-data)
- `mediaId` (opcional): Identificador único para el archivo
- `metadata`: Objeto JSON con metadatos del archivo (requiere campo "accesos")

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "mediaId": "string",
    "fileName": "string",
    "contentType": "string",
    "fileSize": "string",
    "metadata": "JSON"
  }
}
```

### GET `/media/:mediaId`
Descarga un archivo multimedia por su ID.

**Parámetros**:
- `mediaId`: Identificador único del archivo

**Respuesta**: 
El archivo binario con los headers adecuados de Content-Type.

### GET `/media`
Lista todos los archivos multimedia disponibles.

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "name": "string",
      "size": "number",
      "metadata": "object"
    }
  ]
}
```

### DELETE `/media/:mediaId`
Elimina un archivo multimedia por su ID.

**Parámetros**:
- `mediaId`: Identificador único del archivo

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "mediaId": "string"
  }
}
```

## Configuración

Este módulo depende del `StorageModule` para sus operaciones. Asegúrese de que el módulo de almacenamiento esté correctamente configurado según las instrucciones en `/src/storage/readme.md`.

## Validaciones

- Los archivos están limitados a 1MB de tamaño
- Solo se permite un archivo por solicitud
- La metadata debe ser un JSON válido que contenga el campo "accesos"

## Uso en el Código

```typescript
// Inyección del controlador en otro módulo
import { MediaModule } from './media/media.module';

@Module({
  imports: [MediaModule],
})
export class AppModule {}
```

## Ejemplo de Cliente

```typescript
// Ejemplo de carga de archivo con fetch
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('metadata', JSON.stringify({ accesos: ['user1', 'user2'] }));

fetch('http://api.example.com/media', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```
