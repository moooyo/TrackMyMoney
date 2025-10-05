import { BaseService } from './BaseService';
import type { LoginResponse, User } from '@/mocks/handlers/auth';

export class AuthService extends BaseService {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.post<LoginResponse, { username: string; password: string }>(
      '/auth/login',
      { username, password },
    );
    // Store token
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  }

  async verify(): Promise<User> {
    return this.get<User>('/auth/verify');
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();
