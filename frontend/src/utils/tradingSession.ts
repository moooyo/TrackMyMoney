/**
 * 交易时段配置和工具函数
 */

export type TradingSession = 'pre-market' | 'regular' | 'after-hours' | 'extended';
export type KlineView = TradingSession | 'daily' | 'weekly' | 'yearly';

// 主视图模式：全部分时、5日、日K、周K、月K、季K、年K
export type MainViewMode = 'all-sessions' | '5d' | '1d' | '1wk' | '1mo' | '3mo' | '1y';

// 统一视图模式：包含主视图和子时段
export type ViewMode = MainViewMode | TradingSession;

export interface SessionTime {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

export interface TradingHours {
  timezone: string;
  sessions: {
    'pre-market'?: SessionTime;
    regular: SessionTime;
    'after-hours'?: SessionTime;
    extended?: SessionTime;
  };
}

/**
 * 不同市场的交易时间配置
 */
export const MARKET_HOURS: Record<string, TradingHours> = {
  // 美股（纳斯达克、纽交所等）
  US: {
    timezone: 'America/New_York',
    sessions: {
      'pre-market': { start: '04:00', end: '09:30' },
      regular: { start: '09:30', end: '16:00' },
      'after-hours': { start: '16:00', end: '20:00' },
    },
  },
  // 加密货币（24小时交易）
  CRYPTO: {
    timezone: 'UTC',
    sessions: {
      regular: { start: '00:00', end: '23:59' },
      extended: { start: '00:00', end: '23:59' },
    },
  },
  // A股
  CN: {
    timezone: 'Asia/Shanghai',
    sessions: {
      regular: { start: '09:30', end: '15:00' }, // 简化，实际有午休
    },
  },
};

export const SESSION_LABELS: Record<TradingSession, string> = {
  'pre-market': '盘前分时',
  regular: '盘中分时',
  'after-hours': '盘后分时',
  extended: '夜盘分时',
};

export const MAIN_VIEW_LABELS: Record<MainViewMode, string> = {
  'all-sessions': '全部分时',
  '5d': '5日',
  '1d': '日K',
  '1wk': '周K',
  '1mo': '月K',
  '3mo': '季K',
  '1y': '年K',
};

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  ...MAIN_VIEW_LABELS,
  ...SESSION_LABELS,
};

/**
 * 根据视图模式获取对应的interval参数
 */
export function getIntervalForViewMode(viewMode: ViewMode): string {
  switch (viewMode) {
    // 分时图使用分钟级别数据
    case 'all-sessions':
    case 'pre-market':
    case 'regular':
      return '1m'; // 全部分时、盘前、盘中使用1分钟
    case 'after-hours':
    case 'extended':
      return '5m'; // 盘后、夜盘使用5分钟

    // K线图
    case '5d':
      return '5m'; // 5日使用5分钟K线
    case '1d':
      return '15m'; // 日K使用15分钟K线
    case '1wk':
      return '1h'; // 周K使用1小时K线
    case '1mo':
      return '1d'; // 月K使用日K线
    case '3mo':
      return '1d'; // 季K使用日K线
    case '1y':
      return '1wk'; // 年K使用周K线
    default:
      return '1d';
  }
}

/**
 * 根据视图模式获取对应的period参数
 */
export function getPeriodForViewMode(viewMode: ViewMode): string {
  switch (viewMode) {
    // 分时图只获取当天数据
    case 'all-sessions':
    case 'pre-market':
    case 'regular':
    case 'after-hours':
    case 'extended':
      return '1d';

    // K线图获取对应时间范围的数据
    case '5d':
      return '5d'; // 5日数据
    case '1d':
      return '1d'; // 1日数据
    case '1wk':
      return '1wk'; // 1周数据
    case '1mo':
      return '1mo'; // 1月数据
    case '3mo':
      return '3mo'; // 3月数据
    case '1y':
      return '1y'; // 1年数据
    default:
      return '1d';
  }
}

/**
 * 根据交易时段获取对应的interval参数（向后兼容）
 * @deprecated 使用 getIntervalForViewMode 代替
 */
export function getIntervalForSession(session: TradingSession): string {
  return getIntervalForViewMode(session);
}

/**
 * 根据交易时段获取对应的period参数（向后兼容）
 * @deprecated 使用 getPeriodForViewMode 代替
 */
export function getPeriodForSession(session: TradingSession): string {
  return getPeriodForViewMode(session);
}

/**
 * 判断是否为交易时段视图（需要生成完整时间序列）
 */
export function isTradingSessionView(viewMode: ViewMode): boolean {
  return ['pre-market', 'regular', 'after-hours', 'extended'].includes(viewMode);
}

/**
 * 判断是否为分时图视图（使用折线图）
 */
export function isIntradayView(viewMode: ViewMode): boolean {
  return ['all-sessions', 'pre-market', 'regular', 'after-hours', 'extended'].includes(viewMode);
}

/**
 * 判断是否为主视图模式
 */
export function isMainViewMode(viewMode: ViewMode): viewMode is MainViewMode {
  return ['all-sessions', '5d', '1d', '1wk', '1mo', '3mo', '1y'].includes(viewMode);
}

/**
 * 判断是否为子时段（二级视图）
 */
export function isSubSession(viewMode: ViewMode): viewMode is TradingSession {
  return ['pre-market', 'regular', 'after-hours', 'extended'].includes(viewMode);
}

/**
 * 判断符号所属市场
 */
export function getMarketForSymbol(symbol: string): string {
  if (symbol.includes('-USD') || symbol.includes('BTC') || symbol.includes('ETH')) {
    return 'CRYPTO';
  }
  // 默认美股
  return 'US';
}

/**
 * 获取交易时段的时间范围（UTC时间戳）
 */
export function getSessionTimeRange(
  session: TradingSession,
  market: string,
  date?: Date,
): { start: number; end: number } | null {
  const marketHours = MARKET_HOURS[market];
  if (!marketHours) return null;

  const sessionTime = marketHours.sessions[session];
  if (!sessionTime) return null;

  const targetDate = date || new Date();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const day = targetDate.getDate();

  // 解析时间
  const [startHour, startMinute] = sessionTime.start.split(':').map(Number);
  const [endHour, endMinute] = sessionTime.end.split(':').map(Number);

  // 创建本地时间
  const startTime = new Date(year, month, day, startHour, startMinute, 0);
  const endTime = new Date(year, month, day, endHour, endMinute, 0);

  return {
    start: startTime.getTime(),
    end: endTime.getTime(),
  };
}

/**
 * 判断当前是否在交易时段内
 */
export function isInSession(session: TradingSession, market: string, now?: Date): boolean {
  const timeRange = getSessionTimeRange(session, market, now);
  if (!timeRange) return false;

  const currentTime = (now || new Date()).getTime();
  return currentTime >= timeRange.start && currentTime <= timeRange.end;
}

/**
 * 获取当前活跃的交易时段
 */
export function getCurrentSession(market: string, now?: Date): TradingSession | null {
  const sessions: TradingSession[] = ['pre-market', 'regular', 'after-hours', 'extended'];

  for (const session of sessions) {
    if (isInSession(session, market, now)) {
      return session;
    }
  }

  return null;
}

/**
 * 计算交易时段已经过的时间百分比
 */
export function getSessionProgress(session: TradingSession, market: string, now?: Date): number {
  const timeRange = getSessionTimeRange(session, market, now);
  if (!timeRange) return 0;

  const currentTime = (now || new Date()).getTime();
  if (currentTime < timeRange.start) return 0;
  if (currentTime > timeRange.end) return 100;

  const progress = ((currentTime - timeRange.start) / (timeRange.end - timeRange.start)) * 100;
  return Math.min(100, Math.max(0, progress));
}
