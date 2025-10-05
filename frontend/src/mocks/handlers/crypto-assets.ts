import { http, HttpResponse } from 'msw';
import type { ModelsCryptoAsset } from '@/types/generated/data-contracts';
import type { HandlersRefreshPricesResponse } from '@/types/generated/Api';

// Mock data - 包含多个样本数据用于演示
const mockCryptoAssets: ModelsCryptoAsset[] = [
  {
    id: 1,
    name: 'Bitcoin',
    symbol: 'BTC',
    quantity: 0.5,
    purchase_price: 45000.0,
    current_price: 43500.0,
    currency: 'USD',
    description: '比特币 - 数字黄金',
    created_at: '2024-01-10T09:30:00Z',
    updated_at: new Date().toISOString(), // 使用当前时间
  },
  {
    id: 2,
    name: 'Ethereum',
    symbol: 'ETH',
    quantity: 5.0,
    purchase_price: 2200.0,
    current_price: 2450.0,
    currency: 'USD',
    description: '以太坊 - 智能合约平台',
    created_at: '2024-02-05T14:20:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Solana',
    symbol: 'SOL',
    quantity: 50.0,
    purchase_price: 95.0,
    current_price: 102.5,
    currency: 'USD',
    description: 'Solana - 高性能公链',
    created_at: '2024-03-15T11:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Cardano',
    symbol: 'ADA',
    quantity: 1000.0,
    purchase_price: 0.55,
    current_price: 0.48,
    currency: 'USD',
    description: 'Cardano - PoS区块链',
    created_at: '2024-02-20T16:45:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Polkadot',
    symbol: 'DOT',
    quantity: 200.0,
    purchase_price: 6.8,
    current_price: 7.2,
    currency: 'USD',
    description: 'Polkadot - 跨链协议',
    created_at: '2024-03-01T10:15:00Z',
    updated_at: new Date().toISOString(),
  },
];

let nextId = 6;

// Helper function to generate random price change
function generatePriceUpdate(basePrice: number): number {
  const change = (Math.random() - 0.5) * 0.06; // ±3% change (crypto is more volatile)
  return Number((basePrice * (1 + change)).toFixed(2));
}

export const cryptoAssetHandlers = [
  // Create crypto asset
  http.post('/api/assets/crypto', async ({ request }) => {
    const body = (await request.json()) as Omit<
      ModelsCryptoAsset,
      'id' | 'created_at' | 'updated_at'
    >;
    const newAsset: ModelsCryptoAsset = {
      ...body,
      id: nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCryptoAssets.push(newAsset);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: newAsset,
    });
  }),

  // Get all crypto assets
  http.get('/api/assets/crypto', () => {
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockCryptoAssets,
    });
  }),

  // Get crypto asset by ID
  http.get('/api/assets/crypto/:id', ({ params }) => {
    const { id } = params;
    const asset = mockCryptoAssets.find((a) => a.id === Number(id));
    if (!asset) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Crypto asset not found',
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

  // Update crypto asset
  http.put('/api/assets/crypto/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<ModelsCryptoAsset>;
    const assetIndex = mockCryptoAssets.findIndex((a) => a.id === Number(id));
    if (assetIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Crypto asset not found',
        },
        { status: 404 },
      );
    }
    mockCryptoAssets[assetIndex] = {
      ...mockCryptoAssets[assetIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockCryptoAssets[assetIndex],
    });
  }),

  // Delete crypto asset
  http.delete('/api/assets/crypto/:id', ({ params }) => {
    const { id } = params;
    const assetIndex = mockCryptoAssets.findIndex((a) => a.id === Number(id));
    if (assetIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Crypto asset not found',
        },
        { status: 404 },
      );
    }
    mockCryptoAssets.splice(assetIndex, 1);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { message: 'Crypto asset deleted successfully' },
    });
  }),

  // Refresh crypto asset prices
  http.post('/api/assets/crypto/refresh-prices', () => {
    // Update all crypto asset prices with random changes
    const failedSymbols: string[] = [];
    let updatedCount = 0;

    mockCryptoAssets.forEach((asset) => {
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
      message: 'Crypto prices refreshed successfully',
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
export { mockCryptoAssets };
