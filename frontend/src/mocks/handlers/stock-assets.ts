import { http, HttpResponse } from 'msw';
import type { ModelsStockAsset } from '@/types/generated/data-contracts';
import type { HandlersRefreshPricesResponse } from '@/types/generated/Api';

// Mock data - 包含多个样本数据用于演示
const mockStockAssets: ModelsStockAsset[] = [
  {
    id: 1,
    name: 'Apple Inc.',
    broker_account: '华泰证券',
    symbol: 'AAPL',
    quantity: 100,
    purchase_price: 150.0,
    current_price: 178.5,
    currency: 'USD',
    description: '苹果公司股票',
    created_at: '2024-01-15T08:30:00Z',
    updated_at: new Date().toISOString(), // 使用当前时间
  },
  {
    id: 2,
    name: 'Microsoft Corporation',
    broker_account: '华泰证券',
    symbol: 'MSFT',
    quantity: 50,
    purchase_price: 350.0,
    current_price: 378.9,
    currency: 'USD',
    description: '微软公司股票',
    created_at: '2024-02-01T09:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'NVIDIA Corporation',
    broker_account: '中信证券',
    symbol: 'NVDA',
    quantity: 80,
    purchase_price: 450.0,
    current_price: 495.8,
    currency: 'USD',
    description: '英伟达股票 - AI芯片龙头',
    created_at: '2024-03-10T10:15:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'SPDR S&P 500 ETF Trust',
    broker_account: '华泰证券',
    symbol: 'SPY',
    quantity: 200,
    purchase_price: 420.0,
    current_price: 456.2,
    currency: 'USD',
    description: '标普500 ETF',
    created_at: '2024-01-20T11:00:00Z',
    updated_at: new Date().toISOString(),
  },
];

let nextId = 5;

// Helper function to generate random price change
function generatePriceUpdate(basePrice: number): number {
  const change = (Math.random() - 0.5) * 0.04; // ±2% change
  return Number((basePrice * (1 + change)).toFixed(2));
}

export const stockAssetHandlers = [
  // Create stock asset
  http.post('/api/assets/stock', async ({ request }) => {
    const body = (await request.json()) as Omit<
      ModelsStockAsset,
      'id' | 'created_at' | 'updated_at'
    >;
    const newAsset: ModelsStockAsset = {
      ...body,
      id: nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStockAssets.push(newAsset);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: newAsset,
    });
  }),

  // Get all stock assets
  http.get('/api/assets/stock', () => {
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockStockAssets,
    });
  }),

  // Get stock asset by ID
  http.get('/api/assets/stock/:id', ({ params }) => {
    const { id } = params;
    const asset = mockStockAssets.find((a) => a.id === Number(id));
    if (!asset) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Stock asset not found',
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

  // Update stock asset
  http.put('/api/assets/stock/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<ModelsStockAsset>;
    const assetIndex = mockStockAssets.findIndex((a) => a.id === Number(id));
    if (assetIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Stock asset not found',
        },
        { status: 404 },
      );
    }
    mockStockAssets[assetIndex] = {
      ...mockStockAssets[assetIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockStockAssets[assetIndex],
    });
  }),

  // Delete stock asset
  http.delete('/api/assets/stock/:id', ({ params }) => {
    const { id } = params;
    const assetIndex = mockStockAssets.findIndex((a) => a.id === Number(id));
    if (assetIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Stock asset not found',
        },
        { status: 404 },
      );
    }
    mockStockAssets.splice(assetIndex, 1);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { message: 'Stock asset deleted successfully' },
    });
  }),

  // Refresh stock asset prices
  http.post('/api/assets/stock/refresh-prices', () => {
    // Update all stock asset prices with random changes
    const failedSymbols: string[] = [];
    let updatedCount = 0;

    mockStockAssets.forEach((asset) => {
      if (asset.current_price && asset.current_price > 0) {
        asset.current_price = generatePriceUpdate(asset.current_price);
        asset.updated_at = new Date().toISOString();
        updatedCount++;
      } else {
        if (asset.symbol) {
          failedSymbols.push(asset.symbol);
        }
      }
    });

    const response: HandlersRefreshPricesResponse = {
      message: 'Stock prices refreshed successfully',
      updated: updatedCount,
      failed: failedSymbols,
    };

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: response,
    });
  }),
];

// Export mock data for use in assets summary
export { mockStockAssets };
