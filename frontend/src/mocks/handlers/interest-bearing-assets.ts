import { http, HttpResponse } from 'msw';
import type { ModelsInterestBearingAsset } from '@/types/generated/data-contracts';

// Mock data
const mockInterestBearingAssets: ModelsInterestBearingAsset[] = [
  {
    id: 1,
    name: '一年期定期存款',
    amount: 50000,
    currency: 'CNY',
    description: '银行定期存款',
    interest_rate: 2.5,
    start_date: '2024-01-01T00:00:00Z',
    maturity_date: '2025-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

let nextId = 2;

export const interestBearingAssetHandlers = [
  // Create interest-bearing asset
  http.post('/api/assets/interest-bearing', async ({ request }) => {
    const body = (await request.json()) as Omit<
      ModelsInterestBearingAsset,
      'id' | 'created_at' | 'updated_at'
    >;
    const newAsset: ModelsInterestBearingAsset = {
      ...body,
      id: nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockInterestBearingAssets.push(newAsset);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: newAsset,
    });
  }),

  // Get all interest-bearing assets
  http.get('/api/assets/interest-bearing', () => {
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockInterestBearingAssets,
    });
  }),

  // Get interest-bearing asset by ID
  http.get('/api/assets/interest-bearing/:id', ({ params }) => {
    const { id } = params;
    const asset = mockInterestBearingAssets.find((a) => a.id === Number(id));
    if (!asset) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Interest-bearing asset not found',
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

  // Update interest-bearing asset
  http.put('/api/assets/interest-bearing/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<ModelsInterestBearingAsset>;
    const assetIndex = mockInterestBearingAssets.findIndex((a) => a.id === Number(id));
    if (assetIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Interest-bearing asset not found',
        },
        { status: 404 },
      );
    }
    mockInterestBearingAssets[assetIndex] = {
      ...mockInterestBearingAssets[assetIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockInterestBearingAssets[assetIndex],
    });
  }),

  // Delete interest-bearing asset
  http.delete('/api/assets/interest-bearing/:id', ({ params }) => {
    const { id } = params;
    const assetIndex = mockInterestBearingAssets.findIndex((a) => a.id === Number(id));
    if (assetIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Interest-bearing asset not found',
        },
        { status: 404 },
      );
    }
    mockInterestBearingAssets.splice(assetIndex, 1);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { message: 'Interest-bearing asset deleted successfully' },
    });
  }),
];

// Export mock data for use in assets summary
export { mockInterestBearingAssets };
