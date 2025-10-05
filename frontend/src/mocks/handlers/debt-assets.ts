import { http, HttpResponse } from 'msw';
import type { ModelsDebtAsset } from '@/types/generated/data-contracts';

// Mock data
const mockDebtAssets: ModelsDebtAsset[] = [
  {
    id: 1,
    name: '房贷',
    amount: 500000,
    currency: 'CNY',
    creditor: '工商银行',
    interest_rate: 4.9,
    due_date: '2044-12-31T00:00:00Z',
    description: '住房贷款',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

let nextId = 2;

export const debtAssetHandlers = [
  // Create debt asset
  http.post('/api/assets/debt', async ({ request }) => {
    const body = (await request.json()) as Omit<
      ModelsDebtAsset,
      'id' | 'created_at' | 'updated_at'
    >;
    const newAsset: ModelsDebtAsset = {
      ...body,
      id: nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDebtAssets.push(newAsset);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: newAsset,
    });
  }),

  // Get all debt assets
  http.get('/api/assets/debt', () => {
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockDebtAssets,
    });
  }),

  // Get debt asset by ID
  http.get('/api/assets/debt/:id', ({ params }) => {
    const { id } = params;
    const asset = mockDebtAssets.find((a) => a.id === Number(id));
    if (!asset) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Debt asset not found',
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: asset,
    });
  }),

  // Update debt asset
  http.put('/api/assets/debt/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<ModelsDebtAsset>;
    const assetIndex = mockDebtAssets.findIndex((a) => a.id === Number(id));
    if (assetIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Debt asset not found',
        },
        { status: 404 },
      );
    }
    mockDebtAssets[assetIndex] = {
      ...mockDebtAssets[assetIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockDebtAssets[assetIndex],
    });
  }),

  // Delete debt asset
  http.delete('/api/assets/debt/:id', ({ params }) => {
    const { id } = params;
    const assetIndex = mockDebtAssets.findIndex((a) => a.id === Number(id));
    if (assetIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Debt asset not found',
        },
        { status: 404 },
      );
    }
    mockDebtAssets.splice(assetIndex, 1);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { message: 'Debt asset deleted successfully' },
    });
  }),
];

// Export mock data for use in assets summary
export { mockDebtAssets };
