/**
 * Configuración de modelos disponibles para cada proveedor LLM
 */
export class LLMConfig {
  /**
   * Obtiene los modelos disponibles desde variables de entorno
   */
  static getAvailableModels(): { [provider: string]: string[] } {
    return {
      openai: this.parseModelsFromEnv('OPENAI_MODELS', ['o4-mini']),
      anthropic: this.parseModelsFromEnv('ANTHROPIC_MODELS', [
        'claude-3-5-sonnet-20241022',
      ]),
    };
  }

  /**
   * Verifica si un modelo es válido para un proveedor específico
   */
  static isValidModel(provider: string, model: string): boolean {
    const availableModels = this.getAvailableModels();
    return availableModels[provider]?.includes(model) || false;
  }

  /**
   * Obtiene el modelo por defecto para un proveedor
   */
  static getDefaultModel(provider: string): string {
    const models = this.getAvailableModels();
    if (models[provider] && models[provider].length > 0) {
      return models[provider][0];
    }
    return provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'o4-mini';
  }

  /**
   * Parsea la lista de modelos desde variables de entorno
   */
  private static parseModelsFromEnv(
    envVar: string,
    defaultModels: string[],
  ): string[] {
    const envValue = process.env[envVar];
    if (envValue) {
      return envValue.split(',').map((model) => model.trim());
    }
    return defaultModels;
  }
}
