import { http, HttpResponse } from 'msw';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  username: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authHandlers = [
  // Login
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginRequest;

    if (body.username === 'admin' && body.password === 'admin') {
      return HttpResponse.json({
        code: 0,
        message: 'success',
        data: {
          token: 'mock_jwt_token_' + Date.now(),
          user: {
            username: body.username,
          },
        } as LoginResponse,
      });
    }

    return HttpResponse.json(
      {
        code: 401,
        message: 'Invalid username or password',
      },
      { status: 401 },
    );
  }),

  // Verify token
  http.get('/api/auth/verify', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          code: 401,
          message: 'No token provided',
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: {
        username: 'admin',
      } as User,
    });
  }),
];
