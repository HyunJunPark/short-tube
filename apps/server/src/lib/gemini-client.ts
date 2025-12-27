import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODELS } from '../utils/constants';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  getGenerativeModel(modelName: string) {
    return this.genAI.getGenerativeModel({ model: modelName});
  }

  getAPI() {
    return this.genAI;
  }

  /**
   * Try to generate content with model fallback on quota errors
   */
  async generateWithFallback(
    prompt: string | any[],
    preferredModel: string = GEMINI_MODELS[0]
  ): Promise<string> {
    const modelsToTry = [
      preferredModel,
      ...GEMINI_MODELS.filter(m => m !== preferredModel),
    ];

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        const model = this.getGenerativeModel(modelName);
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error: any) {
        lastError = error;

        // If quota error (429), try next model
        if (error.status === 429 || error.message?.includes('quota')) {
          console.warn(`Quota exceeded for ${modelName}, trying next model...`);
          continue;
        }

        // If other error, throw immediately
        throw error;
      }
    }

    // All models failed
    throw lastError || new Error('All Gemini models failed');
  }
}

export const geminiClient = new GeminiClient();
