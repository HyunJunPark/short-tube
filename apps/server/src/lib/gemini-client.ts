import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
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
   * Generate content with text/image content and model fallback on quota errors
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

  /**
   * Generate content with audio file using Files API
   */
  async generateWithAudio(
    filePath: string,
    prompt: string,
    mimeType: string = 'audio/mpeg',
    preferredModel: string = GEMINI_MODELS[0]
  ): Promise<string> {
    const modelsToTry = [
      preferredModel,
      ...GEMINI_MODELS.filter(m => m !== preferredModel),
    ];

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[GeminiClient] 🤖 Attempting audio generation with model: ${modelName}`);
        const startTime = Date.now();

        // Read file and convert to base64
        console.log(`[GeminiClient] 📂 Reading audio file: ${path.basename(filePath)}`);
        const fileData = await fs.readFile(filePath);
        const base64Data = fileData.toString('base64');
        const fileName = path.basename(filePath);
        const fileSizeInMB = (fileData.length / (1024 * 1024)).toFixed(2);
        const base64SizeInMB = (base64Data.length / (1024 * 1024)).toFixed(2);

        console.log(`[GeminiClient] 📊 File details:`);
        console.log(`[GeminiClient]    📦 Original size: ${fileSizeInMB} MB`);
        console.log(`[GeminiClient]    📦 Base64 size: ${base64SizeInMB} MB`);

        // Create content with file
        console.log(`[GeminiClient] 📤 Sending audio data to Gemini API...`);
        const model = this.getGenerativeModel(modelName);
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ]);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const responseLength = result.response.text().length;
        console.log(`[GeminiClient] ✅ Audio generation succeeded with ${modelName}`);
        console.log(`[GeminiClient] ⏱️ Duration: ${duration}s`);
        console.log(`[GeminiClient] 📝 Response length: ${responseLength} characters`);

        return result.response.text();
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || 'Unknown error';
        const status = error.status || 'Unknown';

        // If quota error (429), try next model
        if (error.status === 429 || error.message?.includes('quota')) {
          console.warn(`[GeminiClient] ⚠️ Quota exceeded for ${modelName}, trying next model...`);
          console.warn(`[GeminiClient] 📋 Error: ${errorMessage}`);
          continue;
        }

        // If other error, throw immediately
        console.error(`[GeminiClient] ❌ Audio generation failed with ${modelName}`);
        console.error(`[GeminiClient] 📋 Status: ${status}`);
        console.error(`[GeminiClient] 📋 Error: ${errorMessage}`);
        throw error;
      }
    }

    // All models failed
    console.error(`[GeminiClient] ❌ All Gemini models failed for audio generation`);
    throw lastError || new Error('All Gemini models failed with audio');
  }
}

export const geminiClient = new GeminiClient();
