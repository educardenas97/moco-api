# Health Checks

## Descripción

El sistema implementa verificaciones de salud (health checks) para monitorear el estado de los servicios críticos y proporcionar visibilidad sobre el estado operativo de la aplicación. Estos health checks están disponibles a través de endpoints específicos y pueden ser utilizados para monitoreo, alerta y escalado automático.

## Componentes

El sistema de health checks se basa en el módulo `@nestjs/terminus` e incluye indicadores de salud para:

- **Storage**: Verifica la conexión con Google Cloud Storage
- **Retrieval**: Verifica el funcionamiento del servicio de recuperación de documentos

## API Endpoint

### GET `/health`

Verifica el estado de todos los servicios críticos y devuelve un resumen.

**Respuesta (Éxito)**:
```json
{
  "success": true,
  "message": "Todos los servicios están disponibles",
  "data": {
    "services": [
      { "name": "storage", "status": "ok" },
      { "name": "retrieval", "status": "ok" }
    ]
  }
}
```

**Respuesta (Error)**:
```json
{
  "message": "Error de servicio",
  "error": "storage: Error al conectar con Google Cloud Storage; retrieval: Error al conectar con el servicio de recuperación"
}
```

## Configuración

El sistema de health checks se configura en el `AppModule` con los siguientes componentes:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    TerminusModule,
    // Otros módulos...
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

## Implementación de nuevos indicadores de salud

Para agregar un nuevo indicador de salud, debe:

1. Extender la clase `HealthIndicator` de `@nestjs/terminus`
2. Implementar el método `isHealthy`
3. Registrar el nuevo indicador en `HealthController`

Ejemplo de indicador de salud:
```typescript
@Injectable()
export class MyServiceHealthIndicator extends HealthIndicator {
  constructor(private service: MyService) {
    super();
  }
  
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Verificar servicio
      const isHealthy = await this.service.checkConnection();
      
      return this.getStatus(key, isHealthy, { 
        version: this.service.version
      });
    } catch (error) {
      return this.getStatus(key, false, { 
        error: error.message 
      });
    }
  }
}
```

## Monitoreo

Los health checks se pueden integrar con:

- **Kubernetes**: Para readiness/liveness probes
- **Prometheus**: Para métricas y alertas
- **Cloud Monitoring**: Para monitoreo en nubes como GCP

## Consideraciones

- Los health checks deben ser livianos y rápidos para evitar sobrecarga
- La profundidad de la verificación debe equilibrarse con el tiempo de respuesta
- Los indicadores de salud deben verificar solo las dependencias críticas para el funcionamiento
