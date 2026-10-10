export interface AIModelProvider {
  id: string;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
}
