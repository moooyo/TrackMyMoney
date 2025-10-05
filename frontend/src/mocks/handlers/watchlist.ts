import { http, HttpResponse } from 'msw';
import type { ModelsWatchlist } from '@/types/generated/data-contracts';
import type { WatchlistWithQuote } from '@/services/WatchlistService';

// Mock watchlist data - 自选股票和加密货币
const mockWatchlist: ModelsWatchlist[] = [
  {
    id: 1,
    symbol: 'AAPL',
    name: 'Apple Inc.',
    asset_type: 'stock',
    notes: '关注苹果新产品发布',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-10T08:00:00Z',
  },
  {
    id: 2,
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    asset_type: 'stock',
    notes: '电动车龙头股',
    created_at: '2024-01-15T09:30:00Z',
    updated_at: '2024-01-15T09:30:00Z',
  },
  {
    id: 3,
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    asset_type: 'crypto',
    notes: '数字黄金，长期看好',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
  },
  {
    id: 4,
    symbol: 'ETH-USD',
    name: 'Ethereum',
    asset_type: 'crypto',
    notes: '以太坊 2.0 升级',
    created_at: '2024-02-05T11:00:00Z',
    updated_at: '2024-02-05T11:00:00Z',
  },
  {
    id: 5,
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    asset_type: 'stock',
    notes: 'AI 芯片龙头',
    created_at: '2024-02-10T14:00:00Z',
    updated_at: '2024-02-10T14:00:00Z',
  },
  {
    id: 6,
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    asset_type: 'stock',
    notes: '科技巨头，AI 布局领先',
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2024-02-15T09:00:00Z',
  },
];

let nextId = 7;

// Helper function to generate mock quote data
function generateMockQuote(symbol: string) {
  // 根据symbol设置基础价格
  const basePrices: Record<string, number> = {
    'BTC-USD': 67845.32,
    'ETH-USD': 3456.78,
    'AAPL': 178.5,
    'TSLA': 248.7,
    'NVDA': 495.8,
    'MSFT': 378.9,
    'GOOGL': 142.3,
  };

  const basePrice = basePrices[symbol] || 100;

  // 生成随机涨跌幅 -5% 到 +5%
  const changePercent = (Math.random() - 0.5) * 10;
  const currentPrice = basePrice * (1 + changePercent / 100);
  const change = currentPrice - basePrice;

  return {
    symbol,
    price: Number(currentPrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    volume: Math.floor(Math.random() * 100000000) + 1000000,
    marketCap: Math.floor(Math.random() * 1000000000000),
    high: Number((currentPrice * 1.02).toFixed(2)),
    low: Number((currentPrice * 0.98).toFixed(2)),
    open: Number((basePrice * 1.005).toFixed(2)),
    previousClose: Number(basePrice.toFixed(2)),
  };
}

export const watchlistHandlers = [
  // Get all watchlist items
  http.get('/api/watchlist', () => {
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockWatchlist,
    });
  }),

  // Get watchlist with quotes
  http.get('/api/watchlist/quotes', () => {
    const watchlistWithQuotes: WatchlistWithQuote[] = mockWatchlist.map((item) => ({
      ...item,
      quote: generateMockQuote(item.symbol || ''),
    }));

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: watchlistWithQuotes,
    });
  }),

  // Get watchlist item by ID
  http.get('/api/watchlist/:id', ({ params }) => {
    const { id } = params;
    const item = mockWatchlist.find((w) => w.id === Number(id));
    if (!item) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Watchlist item not found',
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: item,
    });
  }),

  // Create watchlist item
  http.post('/api/watchlist', async ({ request }) => {
    const body = (await request.json()) as Omit<
      ModelsWatchlist,
      'id' | 'created_at' | 'updated_at'
    >;

    // Check if already exists
    const exists = mockWatchlist.find((w) => w.symbol === body.symbol);
    if (exists) {
      return HttpResponse.json(
        {
          code: 400,
          message: 'Symbol already in watchlist',
        },
        { status: 400 },
      );
    }

    const newItem: ModelsWatchlist = {
      ...body,
      id: nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockWatchlist.push(newItem);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: newItem,
    });
  }),

  // Update watchlist item
  http.put('/api/watchlist/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<ModelsWatchlist>;
    const itemIndex = mockWatchlist.findIndex((w) => w.id === Number(id));
    if (itemIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Watchlist item not found',
        },
        { status: 404 },
      );
    }
    mockWatchlist[itemIndex] = {
      ...mockWatchlist[itemIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { message: 'Watchlist item updated successfully' },
    });
  }),

  // Delete watchlist item
  http.delete('/api/watchlist/:id', ({ params }) => {
    const { id } = params;
    const itemIndex = mockWatchlist.findIndex((w) => w.id === Number(id));
    if (itemIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Watchlist item not found',
        },
        { status: 404 },
      );
    }
    mockWatchlist.splice(itemIndex, 1);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { message: 'Watchlist item deleted successfully' },
    });
  }),
];

export { mockWatchlist };
