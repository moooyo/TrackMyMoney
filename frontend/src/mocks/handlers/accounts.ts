import { http, HttpResponse } from 'msw';

export interface Account {
  id: number;
  name: string;
  type: 'cash' | 'interest_bearing_cash' | 'stock' | 'debt' | 'crypto';
  description: string;
  initial_amount: number;
  current_amount: number;
  currency: string;
  account_date: string;
  expected_annual_rate?: number;
  symbol?: string;
  shares?: number;
  crypto_symbol?: string;
  crypto_amount?: number;
  created_at: string;
  updated_at: string;
}

// Mock data
const mockAccounts: Account[] = [
  {
    id: 1,
    name: '工资卡',
    type: 'cash',
    description: '日常使用的工资卡',
    initial_amount: 10000,
    current_amount: 15000,
    currency: 'CNY',
    account_date: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '定期存款',
    type: 'interest_bearing_cash',
    description: '一年期定期存款',
    initial_amount: 50000,
    current_amount: 52000,
    currency: 'CNY',
    account_date: '2024-01-01T00:00:00Z',
    expected_annual_rate: 0.04,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: '沪深300 ETF',
    type: 'stock',
    description: '沪深300指数基金',
    initial_amount: 30000,
    current_amount: 33000,
    currency: 'CNY',
    account_date: '2024-01-01T00:00:00Z',
    symbol: '510300',
    shares: 10000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

let nextId = 4;

export const accountHandlers = [
  // Create account
  http.post('/api/accounts', async ({ request }) => {
    const body = (await request.json()) as Omit<Account, 'id' | 'created_at' | 'updated_at'>;
    const newAccount: Account = {
      ...body,
      id: nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockAccounts.push(newAccount);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: newAccount,
    });
  }),

  // Get all accounts
  http.get('/api/accounts', () => {
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockAccounts,
    });
  }),

  // Get account by ID
  http.get('/api/accounts/:id', ({ params }) => {
    const { id } = params;
    const account = mockAccounts.find((a) => a.id === Number(id));
    if (!account) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Account not found',
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: account,
    });
  }),

  // Update account
  http.put('/api/accounts/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<Account>;
    const accountIndex = mockAccounts.findIndex((a) => a.id === Number(id));
    if (accountIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Account not found',
        },
        { status: 404 },
      );
    }
    mockAccounts[accountIndex] = {
      ...mockAccounts[accountIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockAccounts[accountIndex],
    });
  }),

  // Delete account
  http.delete('/api/accounts/:id', ({ params }) => {
    const { id } = params;
    const accountIndex = mockAccounts.findIndex((a) => a.id === Number(id));
    if (accountIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Account not found',
        },
        { status: 404 },
      );
    }
    mockAccounts.splice(accountIndex, 1);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { message: 'Account deleted successfully' },
    });
  }),
];
