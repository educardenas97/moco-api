# Módulo de Autenticación

## Descripción General
Este módulo de autenticación implementa una estrategia de token Bearer para proteger los endpoints de la API. Valida los tokens contra una lista predefinida almacenada en variables de entorno.

## Configuración

### Variables de Entorno
El módulo utiliza la variable de entorno `VALID_TOKENS` para almacenar los tokens de autenticación válidos. Los múltiples tokens deben estar separados por comas.

```env
VALID_TOKENS=token1,token2,token3
```

### Agregar Nuevos Tokens
Para agregar un nuevo token:

1. Abra su archivo `.env`
2. Localice la variable `VALID_TOKENS`
3. Agregue su nuevo token a la lista separada por comas
4. Se requiere reiniciar el servidor para que los cambios surtan efecto

Ejemplo de cómo agregar un nuevo token:
```env
# Original
VALID_TOKENS=eyJhbGciOiJIUzI1NiJ9.user1.abc123xyz456,eyJhbGciOiJIUzI1NiJ9.user2.def789uvw123

# Después de agregar el nuevo token
VALID_TOKENS=eyJhbGciOiJIUzI1NiJ9.user1.abc123xyz456,eyJhbGciOiJIUzI1NiJ9.user2.def789uvw123,eyJhbGciOiJIUzI1NiJ9.user3.ghi456rst789
```

## Uso

### Realizar Peticiones Autenticadas
Incluya el token en el encabezado de Autorización usando el esquema Bearer:

```http
GET /api/protected-route
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.user1.abc123xyz456
```

### Formato del Token
Aunque cualquier cadena de texto puede usarse como token, se recomienda seguir un formato consistente:
```
eyJhbGciOiJIUzI1NiJ9.{userId}.{randomString}
```

### Respuestas de Error
- Token faltante: 401 No Autorizado - "Token no proporcionado"
- Token inválido: 401 No Autorizado - "Token inválido"

