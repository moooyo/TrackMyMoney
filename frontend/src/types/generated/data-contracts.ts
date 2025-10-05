/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum ModelsNotificationChannel {
  ChannelBark = "bark",
  ChannelTelegramBot = "telegram_bot",
  ChannelEmail = "email",
}

export enum ModelsDataSourceProvider {
  ProviderYahooFinance = "yahoo_finance",
}

export enum ModelsAccountType {
  AccountTypeCash = "cash",
  AccountTypeInterestBearingCash = "interest_bearing_cash",
  AccountTypeStock = "stock",
  AccountTypeDebt = "debt",
  AccountTypeCrypto = "crypto",
}

export interface HandlersAssetHistory {
  categories?: Record<string, number>;
  date?: string;
  net_assets?: number;
  total_assets?: number;
  total_debt?: number;
}

export interface HandlersAssetsSummary {
  categories?: Record<string, number>;
  net_assets?: number;
  total_assets?: number;
  total_debt?: number;
}

export interface HandlersCreateAccountRequest {
  account_date?: string;
  crypto_amount?: number;
  crypto_symbol?: string;
  currency?: string;
  current_amount: number;
  description?: string;
  expected_annual_rate?: number;
  initial_amount: number;
  name: string;
  shares?: number;
  symbol?: string;
  type: ModelsAccountType;
}

export interface HandlersCreateCashAssetRequest {
  amount: number;
  currency?: string;
  data_source_id?: number;
  description?: string;
  name: string;
}

export interface HandlersCreateCryptoAssetRequest {
  current_price?: number;
  data_source_id?: number;
  description?: string;
  name: string;
  purchase_price: number;
  quantity: number;
  /** e.g., BTC, ETH */
  symbol: string;
}

export interface HandlersCreateDataSourceRequest {
  credentials: string;
  description?: string;
  enabled?: boolean;
  name: string;
  provider: ModelsDataSourceProvider;
}

export interface HandlersCreateDebtAssetRequest {
  /** Negative value for liabilities */
  amount: number;
  creditor: string;
  currency?: string;
  data_source_id?: number;
  description?: string;
  due_date?: string;
  interest_rate?: number;
  name: string;
}

export interface HandlersCreateInterestBearingAssetRequest {
  amount: number;
  currency?: string;
  data_source_id?: number;
  description?: string;
  /** Annual interest rate in percentage */
  interest_rate: number;
  maturity_date?: string;
  name: string;
  start_date: string;
}

export interface HandlersCreateNotificationRequest {
  channel: ModelsNotificationChannel;
  config: string;
  description?: string;
  enabled?: boolean;
  name: string;
  schedule?: string;
}

export interface HandlersCreateStockAssetRequest {
  broker_account: string;
  currency?: string;
  current_price?: number;
  data_source_id?: number;
  description?: string;
  name: string;
  purchase_price: number;
  quantity: number;
  symbol: string;
}

export interface HandlersLoginRequest {
  password: string;
  username: string;
}

export interface HandlersLoginResponse {
  token?: string;
  user?: HandlersUser;
}

export interface HandlersUpdateAccountRequest {
  crypto_amount?: number;
  crypto_symbol?: string;
  currency?: string;
  current_amount?: number;
  description?: string;
  expected_annual_rate?: number;
  name?: string;
  shares?: number;
  symbol?: string;
  type?: ModelsAccountType;
}

export interface HandlersUpdateCashAssetRequest {
  amount?: number;
  currency?: string;
  data_source_id?: number;
  description?: string;
  name?: string;
}

export interface HandlersUpdateCryptoAssetRequest {
  current_price?: number;
  data_source_id?: number;
  description?: string;
  name?: string;
  purchase_price?: number;
  quantity?: number;
  symbol?: string;
}

export interface HandlersUpdateDataSourceRequest {
  credentials?: string;
  description?: string;
  enabled?: boolean;
  name?: string;
  provider?: ModelsDataSourceProvider;
}

export interface HandlersUpdateDebtAssetRequest {
  amount?: number;
  creditor?: string;
  currency?: string;
  data_source_id?: number;
  description?: string;
  due_date?: string;
  interest_rate?: number;
  name?: string;
}

export interface HandlersUpdateInterestBearingAssetRequest {
  amount?: number;
  currency?: string;
  data_source_id?: number;
  description?: string;
  interest_rate?: number;
  maturity_date?: string;
  name?: string;
  start_date?: string;
}

export interface HandlersUpdateNotificationRequest {
  channel?: ModelsNotificationChannel;
  config?: string;
  description?: string;
  enabled?: boolean;
  name?: string;
  schedule?: string;
}

export interface HandlersUpdateStockAssetRequest {
  broker_account?: string;
  currency?: string;
  current_price?: number;
  data_source_id?: number;
  description?: string;
  name?: string;
  purchase_price?: number;
  quantity?: number;
  symbol?: string;
}

export interface HandlersUser {
  username?: string;
}

export interface ModelsAccount {
  account_date?: string;
  created_at?: string;
  crypto_amount?: number;
  /** For crypto */
  crypto_symbol?: string;
  currency?: string;
  current_amount?: number;
  description?: string;
  /** For interest-bearing cash */
  expected_annual_rate?: number;
  id?: number;
  initial_amount?: number;
  name?: string;
  shares?: number;
  /** For stocks/ETFs */
  symbol?: string;
  type?: ModelsAccountType;
  updated_at?: string;
}

export interface ModelsCashAsset {
  amount?: number;
  created_at?: string;
  currency?: string;
  data_source_id?: number;
  description?: string;
  id?: number;
  name?: string;
  updated_at?: string;
}

export interface ModelsCryptoAsset {
  created_at?: string;
  /** Can be updated from data source */
  current_price?: number;
  data_source_id?: number;
  description?: string;
  id?: number;
  name?: string;
  /** Average purchase price */
  purchase_price?: number;
  quantity?: number;
  /** e.g., BTC, ETH */
  symbol?: string;
  updated_at?: string;
}

export interface ModelsDataSource {
  created_at?: string;
  /** JSON string of credentials */
  credentials?: string;
  description?: string;
  enabled?: boolean;
  id?: number;
  name?: string;
  provider?: ModelsDataSourceProvider;
  updated_at?: string;
}

export interface ModelsDebtAsset {
  /** Negative value for liabilities */
  amount?: number;
  created_at?: string;
  creditor?: string;
  currency?: string;
  data_source_id?: number;
  description?: string;
  due_date?: string;
  id?: number;
  interest_rate?: number;
  name?: string;
  updated_at?: string;
}

export interface ModelsInterestBearingAsset {
  amount?: number;
  created_at?: string;
  currency?: string;
  data_source_id?: number;
  description?: string;
  id?: number;
  /** Annual interest rate in percentage */
  interest_rate?: number;
  maturity_date?: string;
  name?: string;
  start_date?: string;
  updated_at?: string;
}

export interface ModelsNotification {
  channel?: ModelsNotificationChannel;
  /** JSON string of channel config */
  config?: string;
  created_at?: string;
  description?: string;
  enabled?: boolean;
  id?: number;
  name?: string;
  /** Cron expression */
  schedule?: string;
  updated_at?: string;
}

export interface ModelsStockAsset {
  broker_account?: string;
  created_at?: string;
  currency?: string;
  /** Can be updated from data source */
  current_price?: number;
  data_source_id?: number;
  description?: string;
  id?: number;
  name?: string;
  /** Average purchase price */
  purchase_price?: number;
  quantity?: number;
  symbol?: string;
  updated_at?: string;
}

export interface ResponseResponse {
  code?: number;
  data?: any;
  message?: string;
}
