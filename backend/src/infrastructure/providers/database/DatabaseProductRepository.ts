import { databaseClient } from '../../database/databaseClient';
import { Product } from '../../../domain/entities/Product/Product';
import { ProductEntity } from '../../../domain/entities/Product/ProductEntity';
import { IProductRepository } from '../interfaces/IProductRepository';

/**
 * Converts a DB datetime value (Date or string) back to ISO string.
 */
function toISOString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/**
 * Parses a value that may be a JSON string (from TEXT columns) or already an object (from JSON columns).
 * mysql2 returns JSON columns as parsed objects, so we must handle both.
 */
function parseJsonColumn<T = unknown>(value: unknown): T | undefined {
  if (value == null) return undefined;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') return JSON.parse(value) as T;
  return undefined;
}

/**
 * Database-backed implementation of IProductRepository.
 * Uses separate tables for products and normalized product data.
 */
export class DatabaseProductRepository implements IProductRepository {
  private readonly productsTable = 'products';
  private readonly normalizedTable = 'product_normalized';

  async save(providerId: string, product: ProductEntity): Promise<void> {
    const data = product.toJSON();
    const createdAtDate = new Date(data.createdAt);
    const updatedAtDate = new Date(data.updatedAt);

    const pool = databaseClient.getPool();
    await pool.execute(
      `INSERT INTO ${this.productsTable} (
        id,
        provider_id,
        name,
        price,
        description,
        image_url,
        category,
        sku,
        stock,
        provider,
        provider_data,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        price = VALUES(price),
        description = VALUES(description),
        image_url = VALUES(image_url),
        category = VALUES(category),
        sku = VALUES(sku),
        stock = VALUES(stock),
        provider = VALUES(provider),
        provider_data = VALUES(provider_data),
        updated_at = VALUES(updated_at)`,
      [
        data.id,
        providerId,
        data.name,
        data.price ?? null,
        data.description ?? null,
        data.imageUrl ?? null,
        data.category ?? null,
        data.sku ?? null,
        data.stock ?? null,
        data.provider ?? null,
        data.providerData ? JSON.stringify(data.providerData) : null,
        createdAtDate,
        updatedAtDate,
      ],
    );
  }

  async findById(providerId: string, id: string): Promise<Product | null> {
    const rows = await databaseClient.query<any>(
      `
      SELECT
        id,
        provider_id AS providerId,
        name,
        price,
        description,
        image_url AS imageUrl,
        category,
        sku,
        stock,
        provider,
        provider_data AS providerData,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM ${this.productsTable}
      WHERE provider_id = ? AND id = ?
      LIMIT 1
      `,
      [providerId, id],
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];

    return {
      id: row.id,
      name: row.name,
      price: row.price !== null ? Number(row.price) : undefined,
      description: row.description ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      category: row.category ?? undefined,
      sku: row.sku ?? undefined,
      stock: row.stock !== null && row.stock !== undefined ? Number(row.stock) : undefined,
      provider: row.provider ?? undefined,
      providerData: parseJsonColumn(row.providerData),
      createdAt: toISOString(row.createdAt),
      updatedAt: toISOString(row.updatedAt),
    };
  }

  async findAll(providerId?: string): Promise<Product[]> {
    const params: any[] = [];
    let whereClause = '';

    if (providerId) {
      whereClause = 'WHERE provider_id = ?';
      params.push(providerId);
    }

    const rows = await databaseClient.query<any>(
      `
      SELECT
        id,
        provider_id AS providerId,
        name,
        price,
        description,
        image_url AS imageUrl,
        category,
        sku,
        stock,
        provider,
        provider_data AS providerData,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM ${this.productsTable}
      ${whereClause}
      ORDER BY created_at DESC
      `,
      params,
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price !== null ? Number(row.price) : undefined,
      description: row.description ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      category: row.category ?? undefined,
      sku: row.sku ?? undefined,
      stock: row.stock !== null && row.stock !== undefined ? Number(row.stock) : undefined,
      provider: row.provider ?? undefined,
      providerData: parseJsonColumn(row.providerData),
      createdAt: toISOString(row.createdAt),
      updatedAt: toISOString(row.updatedAt),
    }));
  }

  async delete(providerId: string, id: string): Promise<void> {
    await databaseClient.query(
      `DELETE FROM ${this.productsTable} WHERE provider_id = ? AND id = ?`,
      [providerId, id],
    );

    await databaseClient.query(
      `DELETE FROM ${this.normalizedTable} WHERE provider_id = ? AND product_id = ?`,
      [providerId, id],
    );
  }

  async saveNormalized(
    providerId: string,
    id: string,
    normalizedData: any,
  ): Promise<void> {
    await databaseClient.query(
      `
      INSERT INTO ${this.normalizedTable} (
        provider_id,
        product_id,
        normalized_data
      )
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        normalized_data = VALUES(normalized_data)
      `,
      [providerId, id, JSON.stringify(normalizedData)],
    );
  }

  async findNormalized(providerId: string, id: string): Promise<any | null> {
    const rows = await databaseClient.query<any>(
      `
      SELECT normalized_data AS normalizedData
      FROM ${this.normalizedTable}
      WHERE provider_id = ? AND product_id = ?
      LIMIT 1
      `,
      [providerId, id],
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    return parseJsonColumn(row.normalizedData) ?? null;
  }

  async findAllWithNormalized(
    providerId?: string,
  ): Promise<{ product: Product; hasNormalized: boolean }[]> {
    const params: any[] = [];
    let whereClause = '';

    if (providerId) {
      whereClause = 'WHERE p.provider_id = ?';
      params.push(providerId);
    }

    const rows = await databaseClient.query<any>(
      `
      SELECT
        p.id,
        p.provider_id AS providerId,
        p.name,
        p.price,
        p.description,
        p.image_url AS imageUrl,
        p.category,
        p.sku,
        p.stock,
        p.provider,
        p.provider_data AS providerData,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt,
        n.normalized_data AS normalizedData
      FROM ${this.productsTable} p
      LEFT JOIN ${this.normalizedTable} n
        ON n.provider_id = p.provider_id
       AND n.product_id = p.id
      ${whereClause}
      ORDER BY p.created_at DESC
      `,
      params,
    );

    return rows.map((row) => ({
      product: {
        id: row.id,
        name: row.name,
        price: row.price !== null ? Number(row.price) : undefined,
        description: row.description ?? undefined,
        imageUrl: row.imageUrl ?? undefined,
        category: row.category ?? undefined,
        sku: row.sku ?? undefined,
        stock: row.stock !== null && row.stock !== undefined ? Number(row.stock) : undefined,
        provider: row.provider ?? undefined,
        providerData: parseJsonColumn(row.providerData),
        createdAt: toISOString(row.createdAt),
        updatedAt: toISOString(row.updatedAt),
      },
      hasNormalized: row.normalizedData !== null && row.normalizedData !== undefined,
    }));
  }
}

