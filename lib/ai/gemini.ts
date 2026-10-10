import { AIModelProvider } from './provider';

export class GeminiProvider implements AIModelProvider {
  id: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(
    model: string = process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    apiKey: string = process.env.GEMINI_API_KEY || '',
    timeoutMs: number = 25000
  ) {
    this.id = model;
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured for deployed environment');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Use Google Gemini REST API v1beta
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        this.id
      )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

      const requestBody: {
        contents: Array<{ role?: string; parts: Array<{ text: string }> }>;
        systemInstruction?: { parts: Array<{ text: string }> };
        generationConfig: { temperature: number; topP: number; maxOutputTokens: number };
      } = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      };

      if (systemPrompt) {
        requestBody.systemInstruction = {
          parts: [{ text: systemPrompt }],
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error (status ${res.status}): ${errorText.slice(0, 160)}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      return text.trim();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Gemini inference timed out after ${this.timeoutMs / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
