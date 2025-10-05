import { http, HttpResponse } from 'msw';
import type { HandlersAssetsSummary, HandlersAssetHistory } from '@/types/generated/data-contracts';
import { mockCashAssets } from './cash-assets';
import { mockInterestBearingAssets } from './interest-bearing-assets';
import { mockStockAssets } from './stock-assets';
import { mockDebtAssets } from './debt-assets';
import { mockCryptoAssets } from './crypto-assets';

export const assetsHandlers = [
  // Get assets summary
  http.get('/api/assets/summary', () => {
    let totalAssets = 0;
    let totalDebt = 0;
    const categories: Record<string, number> = {};

    // Sum cash assets
    mockCashAssets.forEach((asset) => {
      const amount = asset.amount || 0;
      totalAssets += amount;
      categories['cash'] = (categories['cash'] || 0) + amount;
    });

    // Sum interest-bearing assets
    mockInterestBearingAssets.forEach((asset) => {
      const amount = asset.amount || 0;
      totalAssets += amount;
      categories['interest_bearing'] = (categories['interest_bearing'] || 0) + amount;
    });

    // Sum stock assets
    mockStockAssets.forEach((asset) => {
      const value = (asset.quantity || 0) * (asset.current_price || asset.purchase_price || 0);
      totalAssets += value;
      categories['stock'] = (categories['stock'] || 0) + value;
    });

    // Sum crypto assets
    mockCryptoAssets.forEach((asset) => {
      const value = (asset.quantity || 0) * (asset.current_price || asset.purchase_price || 0);
      totalAssets += value;
      categories['crypto'] = (categories['crypto'] || 0) + value;
    });

    // Sum debt assets
    mockDebtAssets.forEach((asset) => {
      const amount = asset.amount || 0;
      totalDebt += amount;
      categories['debt'] = (categories['debt'] || 0) + amount;
    });

    const summary: HandlersAssetsSummary = {
      total_assets: totalAssets,
      total_debt: totalDebt,
      net_assets: totalAssets - totalDebt,
      categories,
    };

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: summary,
    });
  }),

  // Get assets history
  http.get('/api/assets/history', ({ request }) => {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d';

    // Generate mock history data
    const history: HandlersAssetHistory[] = [];
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const now = new Date();

    // Calculate current total assets
    let currentTotalAssets = 0;
    let currentTotalDebt = 0;

    mockCashAssets.forEach((asset) => {
      currentTotalAssets += asset.amount || 0;
    });
    mockInterestBearingAssets.forEach((asset) => {
      currentTotalAssets += asset.amount || 0;
    });
    mockStockAssets.forEach((asset) => {
      currentTotalAssets +=
        (asset.quantity || 0) * (asset.current_price || asset.purchase_price || 0);
    });
    mockCryptoAssets.forEach((asset) => {
      currentTotalAssets +=
        (asset.quantity || 0) * (asset.current_price || asset.purchase_price || 0);
    });
    mockDebtAssets.forEach((asset) => {
      currentTotalDebt += asset.amount || 0;
    });

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Simulate some variation in the data
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const totalAssets = currentTotalAssets * (1 + variation);
      const totalDebt = currentTotalDebt;

      history.push({
        date: date.toISOString().split('T')[0],
        total_assets: totalAssets,
        total_debt: totalDebt,
        net_assets: totalAssets - totalDebt,
      });
    }

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: history,
    });
  }),
];
