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

  // Get assets statistics
  http.get('/api/assets/statistics', ({ request }) => {
    const url = new URL(request.url);
    const dimension = url.searchParams.get('dimension') || 'daily';
    const period = url.searchParams.get('period') || '30d';

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

    // Determine data points based on dimension and period
    let dataPoints = 0;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;

    if (dimension === 'daily') {
      dataPoints = days;
    } else if (dimension === 'weekly') {
      dataPoints = Math.ceil(days / 7);
    } else if (dimension === 'monthly') {
      dataPoints = Math.ceil(days / 30);
    }

    const statistics = [];
    const now = new Date();

    for (let i = dataPoints; i >= 0; i--) {
      const date = new Date(now);
      let dateStr = '';

      if (dimension === 'daily') {
        date.setDate(date.getDate() - i);
        dateStr = date.toISOString().split('T')[0];
      } else if (dimension === 'weekly') {
        date.setDate(date.getDate() - i * 7);
        // Get Monday of the week
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        dateStr = date.toISOString().split('T')[0];
      } else if (dimension === 'monthly') {
        date.setMonth(date.getMonth() - i);
        dateStr = date.toISOString().substring(0, 7); // YYYY-MM
      }

      // Simulate growth trend with some variation
      const baseGrowth = 1 + (dataPoints - i) * 0.002; // 0.2% growth per period
      const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
      const totalAssets = currentTotalAssets * baseGrowth * (1 + variation);
      const netAssets = totalAssets - currentTotalDebt;

      // Calculate profit compared to previous period
      let profit = 0;
      let profitRate = 0;
      if (statistics.length > 0) {
        const prevAssets = statistics[statistics.length - 1].total_assets;
        profit = totalAssets - prevAssets;
        profitRate = prevAssets > 0 ? (profit / prevAssets) * 100 : 0;
      }

      statistics.push({
        date: dateStr,
        total_assets: totalAssets,
        profit: profit,
        profit_rate: profitRate,
        net_assets: netAssets,
      });
    }

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: statistics,
    });
  }),
];
