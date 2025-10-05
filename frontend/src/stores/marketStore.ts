import { create } from 'zustand';
import { marketService } from '@/services/MarketService';
import type {
  ModelsQuote,
  ModelsHistoryResponse,
  ModelsInfoResponse,
  ModelsSearchResponse,
} from '@/types/generated/Api';
import logger from '@/utils/logger';

// 缓存项接口
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface MarketState {
  // 缓存数据
  quotesCache: Record<string, CacheItem<ModelsQuote>>;
  historyCache: Record<string, CacheItem<ModelsHistoryResponse>>;
  infoCache: Record<string, CacheItem<ModelsInfoResponse>>;
  searchCache: Record<string, CacheItem<ModelsSearchResponse>>;

  // 状态
  loading: boolean;
  error: string | null;

  // 缓存配置（毫秒）
  quoteCacheDuration: number; // 报价缓存 30 秒
  historyCacheDuration: number; // 历史数据缓存 5 分钟
  infoCacheDuration: number; // 信息缓存 1 小时
  searchCacheDuration: number; // 搜索结果缓存 10 分钟

  // 方法
  getQuote: (symbol: string, forceRefresh?: boolean) => Promise<ModelsQuote>;
  getHistory: (
    symbol: string,
    period?: string,
    interval?: string,
    forceRefresh?: boolean,
  ) => Promise<ModelsHistoryResponse>;
  getInfo: (symbol: string, forceRefresh?: boolean) => Promise<ModelsInfoResponse>;
  search: (query: string, limit?: number, forceRefresh?: boolean) => Promise<ModelsSearchResponse>;
  clearCache: () => void;
  clearQuoteCache: (symbol?: string) => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  // 初始状态
  quotesCache: {},
  historyCache: {},
  infoCache: {},
  searchCache: {},
  loading: false,
  error: null,

  // 缓存配置
  quoteCacheDuration: 30 * 1000, // 30 秒
  historyCacheDuration: 5 * 60 * 1000, // 5 分钟
  infoCacheDuration: 60 * 60 * 1000, // 1 小时
  searchCacheDuration: 10 * 60 * 1000, // 10 分钟

  // 获取报价（带缓存）
  getQuote: async (symbol: string, forceRefresh = false) => {
    const state = get();
    const cacheKey = symbol.toUpperCase();
    const cached = state.quotesCache[cacheKey];

    // 检查缓存
    if (!forceRefresh && cached && Date.now() - cached.timestamp < state.quoteCacheDuration) {
      logger.debug(`Using cached quote for ${symbol}`);
      return cached.data;
    }

    // 请求新数据
    set({ loading: true, error: null });
    try {
      const quote = await marketService.getQuote(symbol);

      // 更新缓存
      set((state) => ({
        quotesCache: {
          ...state.quotesCache,
          [cacheKey]: {
            data: quote,
            timestamp: Date.now(),
          },
        },
        loading: false,
      }));

      logger.info(`Quote fetched and cached for ${symbol}`);
      return quote;
    } catch (error) {
      logger.error(`Failed to fetch quote for ${symbol}`, error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  // 获取历史数据（带缓存）
  getHistory: async (symbol: string, period = '1mo', interval = '1d', forceRefresh = false) => {
    const state = get();
    const cacheKey = `${symbol.toUpperCase()}_${period}_${interval}`;
    const cached = state.historyCache[cacheKey];

    // 检查缓存
    if (!forceRefresh && cached && Date.now() - cached.timestamp < state.historyCacheDuration) {
      logger.debug(`Using cached history for ${symbol}`);
      return cached.data;
    }

    // 请求新数据
    set({ loading: true, error: null });
    try {
      const history = await marketService.getHistory(symbol, period, interval);

      // 更新缓存
      set((state) => ({
        historyCache: {
          ...state.historyCache,
          [cacheKey]: {
            data: history,
            timestamp: Date.now(),
          },
        },
        loading: false,
      }));

      logger.info(`History fetched and cached for ${symbol}`);
      return history;
    } catch (error) {
      logger.error(`Failed to fetch history for ${symbol}`, error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  // 获取信息（带缓存）
  getInfo: async (symbol: string, forceRefresh = false) => {
    const state = get();
    const cacheKey = symbol.toUpperCase();
    const cached = state.infoCache[cacheKey];

    // 检查缓存
    if (!forceRefresh && cached && Date.now() - cached.timestamp < state.infoCacheDuration) {
      logger.debug(`Using cached info for ${symbol}`);
      return cached.data;
    }

    // 请求新数据
    set({ loading: true, error: null });
    try {
      const info = await marketService.getInfo(symbol);

      // 更新缓存
      set((state) => ({
        infoCache: {
          ...state.infoCache,
          [cacheKey]: {
            data: info,
            timestamp: Date.now(),
          },
        },
        loading: false,
      }));

      logger.info(`Info fetched and cached for ${symbol}`);
      return info;
    } catch (error) {
      logger.error(`Failed to fetch info for ${symbol}`, error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  // 搜索（带缓存）
  search: async (query: string, limit = 10, forceRefresh = false) => {
    const state = get();
    const cacheKey = `${query.toLowerCase()}_${limit}`;
    const cached = state.searchCache[cacheKey];

    // 检查缓存
    if (!forceRefresh && cached && Date.now() - cached.timestamp < state.searchCacheDuration) {
      logger.debug(`Using cached search results for ${query}`);
      return cached.data;
    }

    // 请求新数据
    set({ loading: true, error: null });
    try {
      const results = await marketService.search(query, limit);

      // 更新缓存
      set((state) => ({
        searchCache: {
          ...state.searchCache,
          [cacheKey]: {
            data: results,
            timestamp: Date.now(),
          },
        },
        loading: false,
      }));

      logger.info(`Search results fetched and cached for ${query}`);
      return results;
    } catch (error) {
      logger.error(`Failed to search for ${query}`, error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  // 清空所有缓存
  clearCache: () => {
    set({
      quotesCache: {},
      historyCache: {},
      infoCache: {},
      searchCache: {},
    });
    logger.info('All market cache cleared');
  },

  // 清空报价缓存（可指定 symbol）
  clearQuoteCache: (symbol?: string) => {
    if (symbol) {
      const cacheKey = symbol.toUpperCase();
      set((state) => {
        const newCache = { ...state.quotesCache };
        delete newCache[cacheKey];
        return { quotesCache: newCache };
      });
      logger.info(`Quote cache cleared for ${symbol}`);
    } else {
      set({ quotesCache: {} });
      logger.info('All quote cache cleared');
    }
  },
}));
