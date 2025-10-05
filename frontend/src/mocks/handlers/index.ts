import { http, HttpResponse } from 'msw';
import { cashAssetHandlers } from './cash-assets';
import { interestBearingAssetHandlers } from './interest-bearing-assets';
import { stockAssetHandlers } from './stock-assets';
import { debtAssetHandlers } from './debt-assets';
import { cryptoAssetHandlers } from './crypto-assets';
import { notificationHandlers } from './notifications';
import { assetsHandlers } from './assets';
import { authHandlers } from './auth';
import { marketHandlers } from './market';
import { watchlistHandlers } from './watchlist';

export const handlers = [
  // Health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
    });
  }),

  // Auth handlers
  ...authHandlers,

  // Asset handlers
  ...cashAssetHandlers,
  ...interestBearingAssetHandlers,
  ...stockAssetHandlers,
  ...debtAssetHandlers,
  ...cryptoAssetHandlers,

  // Asset summary and history
  ...assetsHandlers,

  // Market handlers
  ...marketHandlers,

  // Watchlist handlers
  ...watchlistHandlers,

  // Notification handlers
  ...notificationHandlers,
];
