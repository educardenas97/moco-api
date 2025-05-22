import { Injectable } from '@nestjs/common';
import { LLMService, LLMProvider } from './llm-service.interface';
import { OpenAILLMService } from './openai-llm.service';

/**
 * Factory para crear instancias de servicios LLM según el proveedor configurado
 */
@Injectable()
export class LLMServiceFactory {
  /**
   * Crea una instancia del servicio LLM adecuado según el proveedor
   * @param provider Proveedor de LLM (openai, google, anthropic)
   * @returns Una instancia del servicio LLM para el proveedor especificado
   */
  createService(provider?: string): LLMService {
    // Si no se especifica un proveedor, utilizar el definido en variables de entorno o OpenAI por defecto
    const selectedProvider = provider || process.env.LLM_PROVIDER || LLMProvider.OPENAI;
    
    switch (selectedProvider.toLowerCase()) {
      case LLMProvider.OPENAI:
        return new OpenAILLMService();
      // Agregar otros proveedores en el futuro
      // case LLMProvider.GOOGLE:
      //   return new GoogleLLMService();
      // case LLMProvider.ANTHROPIC:
      //   return new AnthropicLLMService();
      default:
        // Por defecto, usar OpenAI
        return new OpenAILLMService();
    }
  }
}
