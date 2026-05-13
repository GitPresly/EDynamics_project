import { promises as fs } from 'fs'; // Add this import
import path from 'path';            // Add this import
import { IProvider } from '../../../domain/providers/IProvider';
import { IProviderRepository } from '../../../infrastructure/providers/interfaces/IProviderRepository';
import { ProcessProductsUseCase } from './ProcessProductsUseCase';

export class SyncProviderUseCase {
  constructor(
    private provider: IProvider,
    private providerRepository: IProviderRepository,
    private processProductsUseCase: ProcessProductsUseCase
  ) { }

  async execute(): Promise<{
    success: boolean;
    provider: string;
    sourceFilename: string;
    productsCount: number;
    processedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let productsCount = 0;
    let processedCount = 0;
    let sourceFilename = '';

    try {
      const rawProducts = await this.provider.fetchProducts();
      productsCount = rawProducts.length;

      if (productsCount === 0) {
        return { success: true, provider: this.provider.getName(), sourceFilename: '', productsCount: 0, processedCount: 0, errors: ['No products found'] };
      }

      const providerId = this.provider.getName().toLowerCase();

      // --- DEBUG MIRROR: Save source.json to disk even if using Database driver ---
      try {
        const debugPath = path.resolve(process.cwd(), `data/providers/${providerId}/sources`);
        await fs.mkdir(debugPath, { recursive: true });
        await fs.writeFile(path.join(debugPath, 'source.json'), JSON.stringify(rawProducts, null, 2));
        console.log(`✅ Debug: Raw data mirrored to data/providers/${providerId}/sources/source.json`);
      } catch (e) {
        console.warn('Failed to write debug source.json file, but continuing sync...');
      }
      // --------------------------------------------------------------------------

      // Save to primary repository (MySQL)
      sourceFilename = await this.providerRepository.saveSource(
        providerId,
        this.provider.getName(),
        rawProducts
      );

      const processResult = await this.processProductsUseCase.execute(this.provider, rawProducts);
      processedCount = processResult.processedCount;
      errors.push(...processResult.errors);

      return {
        success: errors.length === 0,
        provider: this.provider.getName(),
        sourceFilename,
        productsCount,
        processedCount,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error(`Sync failed for provider ${this.provider.getName()}:`, errorMessage, errorStack);
      errors.push(`Sync failed: ${errorMessage}`);
      return { success: false, provider: this.provider.getName(), sourceFilename: '', productsCount: 0, processedCount: 0, errors };
    }
  }
}