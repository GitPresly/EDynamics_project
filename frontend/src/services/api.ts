import type { Submission } from '../domain/entities/Submission/Submission';
import type { CreateSubmissionRequest } from '../presentation/requests/Submission/CreateSubmissionRequest';
import type { UpdateSubmissionRequest } from '../presentation/requests/Submission/UpdateSubmissionRequest';
import type { Response } from '../presentation/responses/Response';
import type { CreateSubmissionResponse } from '../presentation/responses/Submission/CreateSubmissionResponse';
import type { GetSubmissionsResponse } from '../presentation/responses/Submission/GetSubmissionsResponse';
import type { UpdateSubmissionResponse } from '../presentation/responses/Submission/UpdateSubmissionResponse';
import type { GetProvidersResponse, ProviderInfo } from '../presentation/responses/Provider/GetProvidersResponse';
import type { SyncProviderResponse } from '../presentation/responses/Provider/SyncProviderResponse';
import type { NormalizeProductsResponse } from '../presentation/responses/Provider/NormalizeProductsResponse';
import type { Product } from '../domain/entities/Product/Product';
import type { User } from '../domain/entities/User/User';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'product_optimizer_token';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<Response<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          ...getAuthHeaders(),
          ...(options?.headers as Record<string, string>),
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async submitForm(request: CreateSubmissionRequest): Promise<Submission> {
    const response = await this.request<Submission>('/submit', {
      method: 'POST',
      body: JSON.stringify(request),
    }) as CreateSubmissionResponse;

    if (!response.data) {
      throw new Error('No data received from server');
    }

    return response.data;
  }

  async getSubmissions(): Promise<Submission[]> {
    const response = await this.request<Submission[]>('/submissions', {
      method: 'GET',
    }) as GetSubmissionsResponse;

    return response.data || [];
  }

  async getSubmissionById(id: string): Promise<Submission> {
    const response = await this.request<Submission>(`/submissions/${id}`, {
      method: 'GET',
    }) as UpdateSubmissionResponse;

    if (!response.data) {
      throw new Error('No data received from server');
    }

    return response.data;
  }

  async updateSubmission(id: string, request: UpdateSubmissionRequest): Promise<Submission> {
    const response = await this.request<Submission>(`/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }) as UpdateSubmissionResponse;

    if (!response.data) {
      throw new Error('No data received from server');
    }

    return response.data;
  }

  // Provider methods
  async getProviders(): Promise<ProviderInfo[]> {
    const response = await this.request<{ providers: ProviderInfo[] }>('/providers', {
      method: 'GET',
    }) as GetProvidersResponse;

    return response.providers || [];
  }

  async syncProvider(provider: string): Promise<SyncProviderResponse> {
    const response = await this.request<{
      provider: string;
      sourceFilename: string;
      productsCount: number;
      processedCount: number;
      errors: string[];
    }>(`/providers/${provider}/sync`, {
      method: 'POST',
    }) as SyncProviderResponse;

    return response;
  }

  async normalizeProducts(provider: string): Promise<NormalizeProductsResponse> {
    const response = await this.request<{
      processedCount: number;
      errors: string[];
      provider?: string;
    }>(`/providers/${provider}/normalize`, {
      method: 'POST',
    }) as NormalizeProductsResponse;

    return response;
  }

  // Product methods
  async getProducts(params?: { category?: string; name?: string; catalogNumber?: string; providerId?: string }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.category?.trim()) searchParams.set('category', params.category.trim());
    if (params?.name?.trim()) searchParams.set('name', params.name.trim());
    if (params?.catalogNumber?.trim()) searchParams.set('catalogNumber', params.catalogNumber.trim());
    if (params?.providerId?.trim()) searchParams.set('providerId', params.providerId.trim());
    const query = searchParams.toString();
    const url = query ? `/products?${query}` : '/products';
    const response = (await this.request<{ products: Product[] }>(url, { method: 'GET' })) as unknown as { products: Product[] };
    return response.products ?? [];
  }

  async getProduct(providerId: string, id: string): Promise<Product> {
    const product = await this.request<Product>(
      `/products/${encodeURIComponent(providerId)}/${encodeURIComponent(id)}`,
      { method: 'GET' }
    ) as unknown as Product;
    return { ...product, providerId };
  }

  async updateProduct(
    providerId: string,
    id: string,
    data: Partial<Pick<Product, 'name' | 'price' | 'description' | 'imageUrl' | 'category' | 'sku' | 'stock' | 'normalizedName' | 'normalizedDescription' | 'normalizedCategory' | 'events'>>
  ): Promise<Product> {
    const product = await this.request<Product>(
      `/products/${encodeURIComponent(providerId)}/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ) as unknown as Product;
    return { ...product, providerId };
  }

  /** Call AI to generate "5 events for merchant gift". Returns enhanced data only; does not save. */
  async enhanceProduct(providerId: string, id: string): Promise<Product> {
    const product = await this.request<Product>(
      `/products/${encodeURIComponent(providerId)}/${encodeURIComponent(id)}/enhance`,
      { method: 'POST' }
    ) as unknown as Product;
    return { ...product, providerId };
  }

  // Users (admin only)
  async getUsers(): Promise<User[]> {
    const response = (await this.request<User[]>('/users', { method: 'GET' })) as unknown as { data: User[] };
    return response.data ?? [];
  }

  async createUser(data: { email: string; password: string; name: string; role: User['role'] }): Promise<User> {
    const response = (await this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })) as unknown as { data: User };
    if (!response.data) throw new Error('No data received');
    return response.data;
  }

  async updateProfile(data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<User> {
    const response = (await this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })) as unknown as { data: User };
    if (!response.data) throw new Error('No data received');
    return response.data;
  }
}

export const apiService = new ApiService();
