import { Product } from '../../../domain/entities/Product/Product';
import { NormalizedProduct } from '../../../domain/entities/NormalizedProduct/NormalizedProduct';
import { ProductEntity } from '../../../domain/entities/Product/ProductEntity';

export interface IProductRepository {
  save(providerId: string, product: ProductEntity): Promise<void>;
  findById(providerId: string, id: string): Promise<Product | null>;
  findAll(providerId?: string): Promise<Product[]>;
  delete(providerId: string, id: string): Promise<void>;
  saveNormalized(providerId: string, id: string, normalizedData: any): Promise<void>;
  findNormalized(providerId: string, id: string): Promise<NormalizedProduct | null>;
  findAllNormalized(providerId?: string): Promise<NormalizedProduct[]>;
  findAllWithNormalized(providerId?: string): Promise<{ product: Product; hasNormalized: boolean }[]>;
}
