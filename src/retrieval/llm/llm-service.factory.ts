import { Injectable } from '@nestjs/common';
import { LLMService, LLMProvider } from './llm-service.interface';
import { OpenAILLMService } from './openai-llm.service';
import { ClaudeLLMService } from './claude-llm.service';

/**
 * Factory para crear instancias de servicios LLM según el proveedor configurado
 */
@Injectable()
export class LLMServiceFactory {
  /**
   * Crea una instancia del servicio LLM adecuado según el proveedor
   * @param provider Proveedor de LLM (openai, google, anthropic)
   * @param model Modelo específico a utilizar (opcional)
   * @returns Una instancia del servicio LLM para el proveedor especificado
   */
  createService(provider?: string, model?: string): LLMService {
    // Si no se especifica un proveedor, utilizar el definido en variables de entorno o OpenAI por defecto
    const selectedProvider =
      provider || process.env.LLM_PROVIDER || LLMProvider.OPENAI;

    switch (selectedProvider.toLowerCase()) {
      case LLMProvider.OPENAI:
        return new OpenAILLMService();
      case LLMProvider.ANTHROPIC:
        return new ClaudeLLMService();
      // Agregar otros proveedores en el futuro
      // case LLMProvider.GOOGLE:
      //   return new GoogleLLMService();
      default:
        // Por defecto, usar OpenAI
        return new OpenAILLMService();
    }
  }
}
