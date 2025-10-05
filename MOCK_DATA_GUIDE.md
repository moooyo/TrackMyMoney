# Mock 数据指南

本文档说明 TrackMyMoney 项目中所有 Mock 数据的配置和使用。

## 📊 市场数据 Mock (market.ts)

### 美股数据
| 代码 | 名称 | 类型 | 基础价格 | 交易所 |
|------|------|------|----------|--------|
| AAPL | Apple Inc. | stock | $178.50 | NASDAQ |
| GOOGL | Alphabet Inc. | stock | $142.30 | NASDAQ |
| MSFT | Microsoft Corporation | stock | $378.90 | NASDAQ |
| TSLA | Tesla, Inc. | stock | $248.70 | NASDAQ |
| NVDA | NVIDIA Corporation | stock | $495.80 | NASDAQ |

### 加密货币数据
| 代码 | 名称 | 类型 | 基础价格 | 交易所 |
|------|------|------|----------|--------|
| BTC-USD | Bitcoin USD | crypto | $67,845.32 | CCC |
| ETH-USD | Ethereum USD | crypto | $3,456.78 | CCC |

### 市场指数数据
| 代码 | 名称 | 类型 | 基础价格 | 说明 |
|------|------|------|----------|------|
| ^IXIC | NASDAQ Composite | index | 16,825.93 | 纳斯达克综合指数 |
| ^GSPC | S&P 500 | index | 5,625.80 | 标普500指数 |
| ^DJI | Dow Jones Industrial Average | index | 42,063.36 | 道琼斯工业平均指数 |

### 价格生成规则
- **波动率**：默认 ±2%（可配置）
- **成交量**：10,000,000 - 100,000,000 随机
- **市值**：基于当前价格和成交量计算
- **指数特殊规则**：成交量和市值设为 0

---

## 🌟 自选关注 Mock (watchlist.ts)

### 默认自选资产（6个）
| ID | 代码 | 名称 | 类型 | 备注 |
|----|------|------|------|------|
| 1 | AAPL | Apple Inc. | stock | 关注苹果新产品发布 |
| 2 | TSLA | Tesla Inc. | stock | 电动车龙头股 |
| 3 | BTC-USD | Bitcoin | crypto | 数字黄金，长期看好 |
| 4 | ETH-USD | Ethereum | crypto | 以太坊 2.0 升级 |
| 5 | NVDA | NVIDIA Corporation | stock | AI 芯片龙头 |
| 6 | MSFT | Microsoft Corporation | stock | 科技巨头，AI 布局领先 |

### 报价数据生成
```typescript
基础价格映射：
- BTC-USD: $67,845.32
- ETH-USD: $3,456.78
- AAPL: $178.50
- TSLA: $248.70
- NVDA: $495.80
- MSFT: $378.90
```

**涨跌幅范围**：-5% 到 +5%（每次刷新随机）

---

## 💰 资产数据 Mock

### 股票资产 (stock-assets.ts)
| ID | 名称 | 代码 | 数量 | 买入价 | 当前价 | 券商 |
|----|------|------|------|--------|--------|------|
| 1 | Apple Inc. | AAPL | 100 | $150.00 | $178.50 | 华泰证券 |
| 2 | Microsoft Corporation | MSFT | 50 | $350.00 | $378.90 | 华泰证券 |
| 3 | NVIDIA Corporation | NVDA | 80 | $450.00 | $495.80 | 中信证券 |
| 4 | SPDR S&P 500 ETF Trust | SPY | 200 | $420.00 | $456.20 | 华泰证券 |

### 加密货币资产 (crypto-assets.ts)
| ID | 名称 | 代码 | 数量 | 买入价 | 当前价 |
|----|------|------|------|--------|--------|
| 1 | Bitcoin | BTC | 0.5 | $45,000.00 | $43,500.00 |
| 2 | Ethereum | ETH | 5.0 | $2,200.00 | $2,450.00 |
| 3 | Solana | SOL | 50.0 | $95.00 | $102.50 |
| 4 | Cardano | ADA | 1000.0 | $0.55 | $0.48 |
| 5 | Polkadot | DOT | 200.0 | $6.80 | $7.20 |

### 现金资产 (cash-assets.ts)
| ID | 名称 | 金额 | 币种 |
|----|------|------|------|
| 1 | 活期存款 | ¥50,000.00 | CNY |
| 2 | 美元现金 | $10,000.00 | USD |

### 计息资产 (interest-bearing-assets.ts)
| ID | 名称 | 金额 | 利率 | 到期日 |
|----|------|------|------|--------|
| 1 | 定期存款 | ¥100,000.00 | 3.5% | 2025-12-31 |

### 债务资产 (debt-assets.ts)
| ID | 名称 | 金额 | 债权人 | 利率 |
|----|------|------|--------|------|
| 1 | 房贷 | ¥800,000.00 | 中国银行 | 4.65% |

---

## 🎯 首页展示数据

### 市场概况
- **纳斯达克指数**：实时从 `^IXIC` 获取
- **自选关注**：显示前 6 个自选资产的实时行情

### 数据刷新
- **手动刷新**：点击"刷新"按钮
- **自动更新**：价格每次请求都会重新生成（模拟实时波动）

---

## 🔧 数据生成函数

### market.ts
```typescript
// 生成价格波动
generatePrice(basePrice, volatility = 0.02)

// 生成完整报价
generateQuote(security: MockSecurity)

// 生成历史数据
generateHistoryData(basePrice, days, interval)
```

### watchlist.ts
```typescript
// 生成自选资产报价
generateMockQuote(symbol: string)
```

### 其他资产 handlers
```typescript
// 生成随机价格更新
generatePriceUpdate(basePrice: number)
```

---

## 📝 使用说明

### 1. 启动 Mock 模式
```bash
make web  # 前端使用 MSW Mock（默认）
```

### 2. 查看数据
- **首页**：纳斯达克指数 + 自选资产前6个
- **自选关注**：所有自选资产 + 实时报价
- **行情查询**：搜索并查看任意资产详情
- **资产管理**：查看持仓资产详情

### 3. 刷新价格
- **自选关注页**：点击"刷新价格"或"自动刷新"
- **首页**：点击市场概况卡片的"刷新"按钮
- **资产管理**：点击"刷新价格"按钮

---

## 🎨 Mock 数据特点

### 真实性
- ✅ 使用真实公司/资产名称
- ✅ 价格基于真实市场水平
- ✅ 涨跌幅在合理范围内（-5% ~ +5%）

### 动态性
- ✅ 每次请求重新生成价格
- ✅ 模拟价格波动
- ✅ 支持历史数据生成

### 完整性
- ✅ 包含所有必要字段
- ✅ 符合 OpenAPI 类型定义
- ✅ 支持所有 CRUD 操作

---

## 🚀 扩展 Mock 数据

### 添加新股票/加密货币
1. 在 `market.ts` 的 `mockSecurities` 数组中添加
2. 在 `watchlist.ts` 的 `basePrices` 中添加价格映射

### 添加新自选资产
在 `watchlist.ts` 的 `mockWatchlist` 数组中添加：
```typescript
{
  id: 7,
  symbol: 'GOOGL',
  name: 'Alphabet Inc.',
  asset_type: 'stock',
  notes: '搜索引擎巨头',
  created_at: '2024-03-01T10:00:00Z',
  updated_at: '2024-03-01T10:00:00Z',
}
```

### 添加新资产类型
1. 创建新的 handler 文件（如 `xxx-assets.ts`）
2. 定义 mock 数据数组
3. 实现 CRUD handlers
4. 在 `handlers/index.ts` 中导入

---

## ⚠️ 注意事项

1. **价格一致性**：确保同一资产在不同 handler 中的 basePrice 一致
2. **ID 管理**：使用 `nextId` 变量管理新增数据的 ID
3. **时间戳**：使用 `new Date().toISOString()` 生成实时时间
4. **类型安全**：所有数据必须符合 TypeScript 类型定义
5. **Mock 边界**：Mock 数据仅在 `VITE_USE_MOCK=true` 时生效

---

## 📚 相关文件

- `/frontend/src/mocks/handlers/market.ts` - 市场数据
- `/frontend/src/mocks/handlers/watchlist.ts` - 自选关注
- `/frontend/src/mocks/handlers/stock-assets.ts` - 股票资产
- `/frontend/src/mocks/handlers/crypto-assets.ts` - 加密货币资产
- `/frontend/src/mocks/handlers/cash-assets.ts` - 现金资产
- `/frontend/src/mocks/handlers/interest-bearing-assets.ts` - 计息资产
- `/frontend/src/mocks/handlers/debt-assets.ts` - 债务资产
- `/frontend/src/mocks/handlers/assets.ts` - 资产汇总
