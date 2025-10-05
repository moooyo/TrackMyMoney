import { http, HttpResponse } from 'msw';
import type { ModelsCashAsset } from '@/types/generated/data-contracts';

// Mock data
const mockCashAssets: ModelsCashAsset[] = [
  {
    id: 1,
    name: '工资卡',
    amount: 15000,
    currency: 'CNY',
    description: '日常使用的工资卡',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '零钱账户',
    amount: 5000,
    currency: 'CNY',
    description: '备用现金',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

let nextId = 3;

export const cashAssetHandlers = [
  // Create cash asset
  http.post('/api/assets/cash', async ({ request }) => {
    const body = (await request.json()) as Omit<
      ModelsCashAsset,
      'id' | 'created_at' | 'updated_at'
    >;
    const newAsset: ModelsCashAsset = {
      ...body,
      id: nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCashAssets.push(newAsset);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: newAsset,
    });
  }),

  // Get all cash assets
  http.get('/api/assets/cash', () => {
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockCashAssets,
    });
  }),

  // Get cash asset by ID
  http.get('/api/assets/cash/:id', ({ params }) => {
    const { id } = params;
    const asset = mockCashAssets.find((a) => a.id === Number(id));
    if (!asset) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Cash asset not found',
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

  // Update cash asset
  http.put('/api/assets/cash/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<ModelsCashAsset>;
    const assetIndex = mockCashAssets.findIndex((a) => a.id === Number(id));
    if (assetIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Cash asset not found',
        },
        { status: 404 },
      );
    }
    mockCashAssets[assetIndex] = {
      ...mockCashAssets[assetIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockCashAssets[assetIndex],
    });
  }),

  // Delete cash asset
  http.delete('/api/assets/cash/:id', ({ params }) => {
    const { id } = params;
    const assetIndex = mockCashAssets.findIndex((a) => a.id === Number(id));
    if (assetIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Cash asset not found',
        },
        { status: 404 },
      );
    }
    mockCashAssets.splice(assetIndex, 1);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { message: 'Cash asset deleted successfully' },
    });
  }),
];

// Export mock data for use in assets summary
export { mockCashAssets };
