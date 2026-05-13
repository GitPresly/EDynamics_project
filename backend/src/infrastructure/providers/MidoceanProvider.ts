import { IProvider } from '../../domain/providers/IProvider';
import { ProductEntity } from '../../domain/entities/Product/ProductEntity';
import { IHttpClient } from '../http/httpClient';

export class MidoceanProvider implements IProvider {
  private httpClient: IHttpClient;
  private apiUrl: string;
  private apiKey: string;

  constructor(httpClient: IHttpClient, apiUrl?: string, apiKey?: string) {
    this.httpClient = httpClient;
    this.apiUrl = apiUrl || process.env.MIDOCEAN_API_URL || '';
    this.apiKey = apiKey || process.env.MIDOCEAN_API_KEY || '';

    if (!this.apiUrl || !this.apiKey) {
      throw new Error('Midocean API URL and API Key are required in environment variables.');
    }
  }

  getName(): string {
    return 'Midocean';
  }

  async fetchProducts(): Promise<any[]> {
    try {
      console.log(`Fetching Midocean products from API: ${this.apiUrl}`);
      
      const response = await this.httpClient.get(this.apiUrl, {
        headers: {
          'x-Gateway-APIKey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      // Midocean usually returns an array directly or inside a 'data' property
      const products = Array.isArray(response) ? response : (response.data || []);
      
      console.log(`Successfully fetched ${products.length} products from Midocean API`);
      return products;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to fetch Midocean products:`, errorMessage);
      throw new Error(`Failed to fetch Midocean products: ${errorMessage}`);
    }
  }

  transformProduct(raw: any): ProductEntity {
    // Standardized extraction following EasyGifts pattern
    const id = this.extractId(raw);
    const name = this.extractName(raw);
    const price = this.extractPrice(raw);
    const description = this.extractDescription(raw);
    const imageUrl = this.extractImageUrl(raw);
    const category = this.extractCategory(raw);
    const sku = this.extractSku(raw);
    const stock = this.extractStock(raw);

    return ProductEntity.create({
      id,
      name,
      price,
      description,
      imageUrl,
      category,
      sku,
      stock,
      provider: this.getName(),
      providerData: raw, // Store original Midocean data for reference
      createdAt: this.extractCreatedAt(raw),
      updatedAt: new Date().toISOString(),
    });
  }

  private extractId(raw: any): string {
    return (
      raw.master_code?.toString() || 
      raw.master_id?.toString() || 
      raw.sku?.toString() ||
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
  }

  private extractName(raw: any): string {
    return (
      raw.product_name?.toString() || 
      raw.short_description?.toString() || 
      'Unnamed Midocean Product'
    );
  }

  private extractPrice(raw: any): number | undefined {
    // Midocean main products API often returns 0 or null for price
    const price = raw.price || raw.unit_price || raw.sales_price;
    if (price === undefined || price === null) return 0;
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    return isNaN(numPrice) ? 0 : numPrice;
  }

  private extractDescription(raw: any): string | undefined {
    return (
      raw.long_description?.toString() || 
      raw.short_description?.toString() || 
      ''
    );
  }

  private extractImageUrl(raw: any): string | undefined {
    // Midocean puts images inside variants -> digital_assets
    if (raw.variants && raw.variants[0] && raw.variants[0].digital_assets) {
      const mainImage = raw.variants[0].digital_assets.find(
        (asset: any) => asset.type === 'image' && asset.subtype === 'item_picture_front'
      );
      return mainImage?.url || raw.variants[0].digital_assets[0]?.url;
    }
    return undefined;
  }

  private extractCategory(raw: any): string | undefined {
    return (
      raw.product_class?.toString() || 
      raw.category_level1?.toString() || 
      'General'
    );
  }

  private extractSku(raw: any): string | undefined {
    return raw.master_code?.toString() || raw.sku?.toString();
  }

  private extractStock(raw: any): number | undefined {
    // Midocean usually requires a separate API for stock, but we map what's available
    const stock = raw.stock || raw.total_stock || raw.quantity;
    if (stock === undefined || stock === null) return 0;

    const numStock = typeof stock === 'string' ? parseInt(stock, 10) : Number(stock);
    return isNaN(numStock) ? 0 : numStock;
  }

  private extractCreatedAt(raw: any): string {
    // Use Midocean timestamp if available, otherwise now
    if (raw.timestamp) return new Date(raw.timestamp).toISOString();
    return new Date().toISOString();
  }
}