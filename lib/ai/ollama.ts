import { AIModelProvider } from './provider';

export class OllamaProvider implements AIModelProvider {
  id: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(
    model: string = process.env.OLLAMA_MODEL || 'gemma2:2b',
    baseUrl: string = process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    timeoutMs: number = 30000
  ) {
    this.id = model;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.id,
          prompt,
          system: systemPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Ollama service returned error status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.response) {
        throw new Error('Empty response from Ollama model generation');
      }

      return data.response.trim();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Ollama model inference timed out after ${this.timeoutMs / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
