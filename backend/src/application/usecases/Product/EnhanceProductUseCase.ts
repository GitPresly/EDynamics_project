import type { IChatCompletionClient, ChatMessage } from '../../../domain/ai/IChatCompletionClient';
import type { IProductRepository } from '../../../infrastructure/providers/interfaces/IProductRepository';
import type { NormalizedProduct } from '../../../domain/entities/NormalizedProduct/NormalizedProduct';

/**
 * Clean AI response to be a simple comma-separated list of exactly 5 items.
 */
function cleanAiResponse(raw: string): string {
  return raw
    .split(/[\n,]/)
    .map(s => s.replace(/^\d+[.)]\s*/, '').replace(/^[*-]\s*/, '').replace(/\*\*/g, '').trim())
    .filter(s => s.length > 2)
    .slice(0, 5)
    .join(', ');
}

function productSummary(product: NormalizedProduct): string {
  const name = product.normalizedName ?? product.name ?? 'Unknown product';
  const category = product.normalizedCategory ?? product.category ?? '';
  const desc = product.normalizedDescription ?? product.description ?? '';
  return `Product: ${name}\nCategory: ${category}\nDescription: ${desc}`;
}

export class EnhanceProductUseCase {
  constructor(private productRepository: IProductRepository, private aiClient: IChatCompletionClient) {}

  async execute(params: { providerId: string; productId: string; type: 'events' | 'audience' | 'emotion' }) {
    const product = await this.productRepository.findNormalized(params.providerId, params.productId);
    if (!product) throw new Error('Product not found');

    const summary = productSummary(product);
    let userPrompt = '';

    if (params.type === 'events') {
      userPrompt = `List exactly 5 specific corporate events or occasions where this product would be a perfect gift. Provide ONLY the list separated by commas:\n${summary}`;
    } else if (params.type === 'audience') {
      userPrompt = `List exactly 5 specific target audience groups who would be most interested in this product. Provide ONLY the list separated by commas:\n${summary}`;
    } else if (params.type === 'emotion') {
      userPrompt = `List exactly 5 specific emotions or feelings this product should evoke in a customer. Provide ONLY the list separated by commas:\n${summary}`;
    }

    const messages: ChatMessage[] = [
      { 
        role: 'system', 
        content: 'You are a marketing expert. Respond with ONLY 5 items separated by commas. No titles, no intro, no numbers, no markdown.' 
      },
      { 
        role: 'user', 
        content: userPrompt 
      }
    ];

    // Use .chat() to match IChatCompletionClient interface
    const aiResponse = await this.aiClient.chat(messages);
    const result = cleanAiResponse(aiResponse);

    return {
      type: params.type,
      result: result
    };
  }
}