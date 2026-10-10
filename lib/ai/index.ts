import { AIModelProvider } from './provider';
import { OllamaProvider } from './ollama';
import { GeminiProvider } from './gemini';

/**
 * Factory to get configured narrative engine.
 * Automatically selects Gemini in production / Render deployment,
 * and open-weight Gemma through Ollama for local development.
 */
export function getModelProvider(): AIModelProvider {
  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Use Gemini if explicitly requested via AI_PROVIDER=gemini, or in production/Render when GEMINI_API_KEY is available
  const preferredProvider = process.env.AI_PROVIDER?.toLowerCase();

  if (preferredProvider === 'gemini' || (isProduction && geminiApiKey) || (geminiApiKey && preferredProvider !== 'ollama')) {
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    return new GeminiProvider(geminiModel, geminiApiKey);
  }

  // Default to local open-weight Gemma via Ollama
  const modelName = process.env.OLLAMA_MODEL || 'gemma2:2b';
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  return new OllamaProvider(modelName, baseUrl);
}
