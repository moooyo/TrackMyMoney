import logger from '@/utils/logger';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export class BaseService {
  private baseURL: string;

  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('API request failed', { url, status: response.status, data });
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      logger.error('API request error', { url, error });
      throw error;
    }
  }

  protected async get<T>(url: string): Promise<T> {
    const response = await this.request<T>(url, { method: 'GET' });
    return response.data;
  }

  protected async post<T, D = unknown>(url: string, data?: D): Promise<T> {
    const response = await this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.data;
  }

  protected async put<T, D = unknown>(url: string, data?: D): Promise<T> {
    const response = await this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.data;
  }

  protected async delete<T>(url: string): Promise<T> {
    const response = await this.request<T>(url, { method: 'DELETE' });
    return response.data;
  }
}
