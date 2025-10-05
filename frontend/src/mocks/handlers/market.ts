import { http, HttpResponse } from 'msw';
import type {
  ModelsQuote,
  ModelsQuotesRequest,
  ModelsQuotesResponse,
  ModelsHistoryResponse,
  ModelsHistoryDataPoint,
  ModelsInfoResponse,
  ModelsSearchResponse,
  ModelsSearchResult,
} from '@/types/generated/Api';

// Mock security database
interface MockSecurity {
  symbol: string;
  name: string;
  type: string;
  market: string;
  currency: string;
  exchange: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  country?: string;
  basePrice: number; // Base price for generating realistic data
}

const mockSecurities: MockSecurity[] = [
  // 美股
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    market: 'US',
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    website: 'https://www.apple.com',
    country: 'US',
    basePrice: 178.5,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'stock',
    market: 'US',
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Internet Content & Information',
    description: 'Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
    website: 'https://abc.xyz',
    country: 'US',
    basePrice: 142.3,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    type: 'stock',
    market: 'US',
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
    website: 'https://www.microsoft.com',
    country: 'US',
    basePrice: 378.9,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    type: 'stock',
    market: 'US',
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.',
    website: 'https://www.tesla.com',
    country: 'US',
    basePrice: 248.7,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    type: 'stock',
    market: 'US',
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Semiconductors',
    description: 'NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.',
    website: 'https://www.nvidia.com',
    country: 'US',
    basePrice: 495.8,
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    type: 'etf',
    market: 'US',
    currency: 'USD',
    exchange: 'NYSE',
    sector: 'ETF',
    industry: 'Index Fund',
    description: 'The SPDR S&P 500 ETF Trust seeks to provide investment results that correspond to the price and yield performance of the S&P 500 Index.',
    website: 'https://www.ssga.com',
    country: 'US',
    basePrice: 456.2,
  },

  // 加密货币 (Yahoo Finance format: BTC-USD)
  {
    symbol: 'BTC-USD',
    name: 'Bitcoin USD',
    type: 'crypto',
    market: 'CRYPTO',
    currency: 'USD',
    exchange: 'CCC',
    sector: 'Cryptocurrency',
    industry: 'Cryptocurrency',
    description: 'Bitcoin is a decentralized digital currency, without a central bank or single administrator.',
    website: 'https://bitcoin.org',
    country: 'Worldwide',
    basePrice: 67845.32,
  },
  {
    symbol: 'ETH-USD',
    name: 'Ethereum USD',
    type: 'crypto',
    market: 'CRYPTO',
    currency: 'USD',
    exchange: 'CCC',
    sector: 'Cryptocurrency',
    industry: 'Cryptocurrency',
    description: 'Ethereum is a decentralized, open-source blockchain with smart contract functionality.',
    website: 'https://ethereum.org',
    country: 'Worldwide',
    basePrice: 3456.78,
  },
  // 指数
  {
    symbol: '^IXIC',
    name: 'NASDAQ Composite',
    type: 'index',
    market: 'US',
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Index',
    industry: 'Index',
    description: 'The NASDAQ Composite Index is a market capitalization-weighted index of more than 3,000 stocks listed on the NASDAQ stock exchange.',
    website: 'https://www.nasdaq.com',
    country: 'US',
    basePrice: 16825.93,
  },
  {
    symbol: '^GSPC',
    name: 'S&P 500',
    type: 'index',
    market: 'US',
    currency: 'USD',
    exchange: 'SNP',
    sector: 'Index',
    industry: 'Index',
    description: 'The S&P 500 is a stock market index tracking the stock performance of 500 of the largest companies listed on stock exchanges in the United States.',
    website: 'https://www.spglobal.com',
    country: 'US',
    basePrice: 5625.80,
  },
  {
    symbol: '^DJI',
    name: 'Dow Jones Industrial Average',
    type: 'index',
    market: 'US',
    currency: 'USD',
    exchange: 'DJI',
    sector: 'Index',
    industry: 'Index',
    description: 'The Dow Jones Industrial Average is a stock market index of 30 prominent companies listed on stock exchanges in the United States.',
    website: 'https://www.dowjones.com',
    country: 'US',
    basePrice: 42063.36,
  },
];

// Helper function to generate realistic price fluctuation
function generatePrice(basePrice: number, volatility = 0.02): number {
  const change = (Math.random() - 0.5) * 2 * volatility;
  return Number((basePrice * (1 + change)).toFixed(2));
}

// Helper function to generate quote from security
function generateQuote(security: MockSecurity): ModelsQuote {
  const currentPrice = generatePrice(security.basePrice);
  const previousClose = generatePrice(security.basePrice, 0.01);
  const change = currentPrice - previousClose;
  const changePercent = (change / previousClose) * 100;

  // 指数不需要volume和marketCap
  const isIndex = security.type === 'index';
  const volume = isIndex ? 0 : Math.floor(Math.random() * 100000000) + 10000000;
  const marketCap = isIndex ? 0 : Math.floor(currentPrice * volume * (Math.random() * 50 + 50));

  return {
    symbol: security.symbol,
    name: security.name,
    price: currentPrice,
    previous_close: previousClose,
    change,
    change_percent: Number(changePercent.toFixed(2)),
    volume,
    market_cap: marketCap,
    currency: security.currency,
    timestamp: Date.now(),
  };
}

// Helper function to generate historical data points
function generateHistoryData(
  basePrice: number,
  days: number,
  interval: string = '1d',
): ModelsHistoryDataPoint[] {
  const dataPoints: ModelsHistoryDataPoint[] = [];
  let currentPrice = basePrice;

  // Parse interval to determine time unit and count
  const intervalMap: Record<string, { unit: 'minute' | 'day'; count: number }> = {
    '1m': { unit: 'minute', count: 1 },
    '5m': { unit: 'minute', count: 5 },
    '15m': { unit: 'minute', count: 15 },
    '30m': { unit: 'minute', count: 30 },
    '1h': { unit: 'minute', count: 60 },
    '1d': { unit: 'day', count: 1 },
    '5d': { unit: 'day', count: 5 },
    '1wk': { unit: 'day', count: 7 },
  };

  const intervalConfig = intervalMap[interval] || { unit: 'day', count: 1 };
  const isMinuteInterval = intervalConfig.unit === 'minute';

  // Calculate total data points
  let totalPoints = days;
  if (isMinuteInterval) {
    // For minute intervals, calculate points based on trading hours
    // Assume 6.5 trading hours per day (390 minutes)
    const tradingMinutesPerDay = 390;
    totalPoints = Math.floor((days * tradingMinutesPerDay) / intervalConfig.count);
  }

  // Generate data points
  for (let i = totalPoints - 1; i >= 0; i--) {
    const now = new Date();

    if (isMinuteInterval) {
      // For minute intervals, go back by minutes
      now.setMinutes(now.getMinutes() - i * intervalConfig.count);
    } else {
      // For day intervals, go back by days
      now.setDate(now.getDate() - i * intervalConfig.count);
    }

    // Adjust volatility based on time unit
    const volatility = isMinuteInterval ? 0.002 : 0.02; // ±0.2% for minutes, ±2% for days
    const change = (Math.random() - 0.5) * 2 * volatility;

    const open = currentPrice;
    const close = Number((currentPrice * (1 + change)).toFixed(2));
    const high = Number((Math.max(open, close) * (1 + Math.random() * 0.01)).toFixed(2));
    const low = Number((Math.min(open, close) * (1 - Math.random() * 0.01)).toFixed(2));
    const volume = isMinuteInterval
      ? Math.floor(Math.random() * 500000) + 10000
      : Math.floor(Math.random() * 5000000) + 1000000;

    dataPoints.push({
      date: isMinuteInterval
        ? now.toISOString()
        : now.toISOString().split('T')[0],
      timestamp: now.getTime(),
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return dataPoints;
}

export const marketHandlers = [
  // GET /api/market/quote/:symbol - Get single quote
  http.get('/api/market/quote/:symbol', ({ params }) => {
    const { symbol } = params;
    const symbolStr = String(symbol).toUpperCase();

    const security = mockSecurities.find((s) => s.symbol === symbolStr);

    if (!security) {
      return HttpResponse.json(
        {
          code: 404,
          message: `Symbol not found: ${symbolStr}`,
        },
        { status: 404 },
      );
    }

    const quote = generateQuote(security);

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: quote,
    });
  }),

  // POST /api/market/quotes - Get batch quotes
  http.post('/api/market/quotes', async ({ request }) => {
    const body = (await request.json()) as ModelsQuotesRequest;
    const { symbols } = body;

    if (!symbols || symbols.length === 0) {
      return HttpResponse.json(
        {
          code: 400,
          message: 'Symbols array is required',
        },
        { status: 400 },
      );
    }

    const quotes: ModelsQuote[] = [];
    const failedSymbols: string[] = [];

    for (const symbol of symbols) {
      const symbolUpper = symbol.toUpperCase();
      const security = mockSecurities.find((s) => s.symbol === symbolUpper);

      if (security) {
        quotes.push(generateQuote(security));
      } else {
        failedSymbols.push(symbol);
      }
    }

    const response: ModelsQuotesResponse = {
      quotes,
      success_count: quotes.length,
      failed_symbols: failedSymbols,
    };

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: response,
    });
  }),

  // GET /api/market/history/:symbol - Get historical data
  http.get('/api/market/history/:symbol', ({ params, request }) => {
    const { symbol } = params;
    const symbolStr = String(symbol).toUpperCase();
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '1mo';
    const interval = url.searchParams.get('interval') || '1d';

    const security = mockSecurities.find((s) => s.symbol === symbolStr);

    if (!security) {
      return HttpResponse.json(
        {
          code: 404,
          message: `Symbol not found: ${symbolStr}`,
        },
        { status: 404 },
      );
    }

    // Map period to number of days
    const periodDays: Record<string, number> = {
      '1d': 1,
      '5d': 5,
      '1mo': 30,
      '3mo': 90,
      '6mo': 180,
      '1y': 365,
      '2y': 730,
      '5y': 1825,
      '10y': 3650,
    };

    const days = periodDays[period] || 30;
    const dataPoints = generateHistoryData(security.basePrice, days, interval);

    const response: ModelsHistoryResponse = {
      symbol: symbolStr,
      period,
      interval,
      currency: security.currency,
      data_points: dataPoints,
    };

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: response,
    });
  }),

  // GET /api/market/info/:symbol - Get stock/crypto information
  http.get('/api/market/info/:symbol', ({ params }) => {
    const { symbol } = params;
    const symbolStr = String(symbol).toUpperCase();

    const security = mockSecurities.find((s) => s.symbol === symbolStr);

    if (!security) {
      return HttpResponse.json(
        {
          code: 404,
          message: `Symbol not found: ${symbolStr}`,
        },
        { status: 404 },
      );
    }

    const currentPrice = generatePrice(security.basePrice);
    const marketCap = Math.floor(currentPrice * 1000000000);

    const info: ModelsInfoResponse = {
      symbol: symbolStr,
      name: security.name,
      sector: security.sector,
      industry: security.industry,
      market_cap: marketCap,
      description: security.description,
      currency: security.currency,
      website: security.website,
      country: security.country,
    };

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: info,
    });
  }),

  // GET /api/market/search - Search stocks/crypto
  http.get('/api/market/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limitStr = url.searchParams.get('limit') || '10';
    const limit = parseInt(limitStr, 10);

    if (!query) {
      return HttpResponse.json(
        {
          code: 400,
          message: "Query parameter 'q' is required",
        },
        { status: 400 },
      );
    }

    const queryLower = query.toLowerCase();

    // Search by symbol or name
    const allResults = mockSecurities.filter(
      (security) =>
        security.symbol.toLowerCase().includes(queryLower) ||
        security.name.toLowerCase().includes(queryLower),
    );

    const results: ModelsSearchResult[] = allResults
      .slice(0, limit)
      .map((security) => ({
        symbol: security.symbol,
        name: security.name,
        exchange: security.exchange,
        asset_type: security.type,
      }));

    const response: ModelsSearchResponse = {
      query,
      results,
      count: results.length,
    };

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: response,
    });
  }),
];
