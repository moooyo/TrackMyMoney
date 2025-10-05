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

export interface HandlersAssetHistoryResponse {
  categories?: Record<string, number>;
  date?: string;
  net_assets?: number;
  total_assets?: number;
  total_debt?: number;
}

export interface HandlersAssetStatisticsItem {
  date?: string;
  net_assets?: number;
  profit?: number;
  profit_rate?: number;
  total_assets?: number;
}

export interface HandlersAssetsSummary {
  categories?: Record<string, number>;
  net_assets?: number;
  total_assets?: number;
  total_debt?: number;
}

export interface HandlersAssetsSummaryResponse {
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
  description?: string;
  name: string;
}

export interface HandlersCreateCryptoAssetRequest {
  current_price?: number;
  description?: string;
  name: string;
  purchase_price: number;
  quantity: number;
  /** e.g., BTC, ETH */
  symbol: string;
}

export interface HandlersCreateDebtAssetRequest {
  /** Negative value for liabilities */
  amount: number;
  creditor: string;
  currency?: string;
  description?: string;
  due_date?: string;
  interest_rate?: number;
  name: string;
}

export interface HandlersCreateInterestBearingAssetRequest {
  amount: number;
  currency?: string;
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

export interface HandlersCreateScheduledJobRequest {
  config?: string;
  description?: string;
  enabled?: boolean;
  name: string;
  schedule: string;
  type: string;
}

export interface HandlersCreateStockAssetRequest {
  broker_account: string;
  currency?: string;
  current_price?: number;
  description?: string;
  name: string;
  purchase_price: number;
  quantity: number;
  symbol: string;
}

export interface HandlersCreateWatchlistRequest {
  asset_type: string;
  name: string;
  notes?: string;
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

export interface HandlersRefreshPricesResponse {
  failed?: string[];
  message?: string;
  updated?: number;
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
  description?: string;
  name?: string;
}

export interface HandlersUpdateCryptoAssetRequest {
  current_price?: number;
  description?: string;
  name?: string;
  purchase_price?: number;
  quantity?: number;
  symbol?: string;
}

export interface HandlersUpdateDebtAssetRequest {
  amount?: number;
  creditor?: string;
  currency?: string;
  description?: string;
  due_date?: string;
  interest_rate?: number;
  name?: string;
}

export interface HandlersUpdateInterestBearingAssetRequest {
  amount?: number;
  currency?: string;
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

export interface HandlersUpdateScheduledJobRequest {
  config?: string;
  description?: string;
  enabled?: boolean;
  name?: string;
  schedule?: string;
  type?: string;
}

export interface HandlersUpdateStockAssetRequest {
  broker_account?: string;
  currency?: string;
  current_price?: number;
  description?: string;
  name?: string;
  purchase_price?: number;
  quantity?: number;
  symbol?: string;
}

export interface HandlersUpdateWatchlistRequest {
  notes?: string;
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
  description?: string;
  id?: number;
  name?: string;
  updated_at?: string;
}

export interface ModelsCryptoAsset {
  created_at?: string;
  /** Can be updated from market API */
  current_price?: number;
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

export interface ModelsDebtAsset {
  /** Negative value for liabilities */
  amount?: number;
  created_at?: string;
  creditor?: string;
  currency?: string;
  description?: string;
  due_date?: string;
  id?: number;
  interest_rate?: number;
  name?: string;
  updated_at?: string;
}

export interface ModelsHistoryDataPoint {
  close?: number;
  date?: string;
  high?: number;
  low?: number;
  open?: number;
  /** Unix timestamp in milliseconds */
  timestamp?: number;
  volume?: number;
}

export interface ModelsHistoryResponse {
  currency?: string;
  data_points?: ModelsHistoryDataPoint[];
  interval?: string;
  period?: string;
  symbol?: string;
}

export interface ModelsInfoResponse {
  country?: string;
  currency?: string;
  description?: string;
  industry?: string;
  market_cap?: number;
  name?: string;
  sector?: string;
  symbol?: string;
  website?: string;
}

export interface ModelsInterestBearingAsset {
  amount?: number;
  created_at?: string;
  currency?: string;
  description?: string;
  id?: number;
  /** Annual interest rate in percentage */
  interest_rate?: number;
  maturity_date?: string;
  name?: string;
  start_date?: string;
  updated_at?: string;
}

export interface ModelsJobExecutionLog {
  created_at?: string;
  /** Duration in milliseconds */
  duration?: number;
  error_msg?: string;
  finished_at?: string;
  id?: number;
  job_name?: string;
  started_at?: string;
  /** "success", "failed", "running" */
  status?: string;
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

export interface ModelsQuote {
  change?: number;
  change_percent?: number;
  currency?: string;
  market_cap?: number;
  name?: string;
  previous_close?: number;
  price?: number;
  symbol?: string;
  timestamp?: number;
  volume?: number;
}

export interface ModelsQuotesRequest {
  /** @minItems 1 */
  symbols: string[];
}

export interface ModelsQuotesResponse {
  failed_symbols?: string[];
  quotes?: ModelsQuote[];
  success_count?: number;
}

export interface ModelsScheduledJob {
  /** JSON string of job-specific config */
  config?: string;
  created_at?: string;
  description?: string;
  enabled?: boolean;
  id?: number;
  last_run_at?: string;
  name?: string;
  next_run_at?: string;
  /** Cron expression */
  schedule?: string;
  /** "snapshot", "notification", etc. */
  type?: string;
  updated_at?: string;
}

export interface ModelsSearchResponse {
  count?: number;
  query?: string;
  results?: ModelsSearchResult[];
}

export interface ModelsSearchResult {
  asset_type?: string;
  exchange?: string;
  name?: string;
  symbol?: string;
}

export interface ModelsStockAsset {
  broker_account?: string;
  created_at?: string;
  currency?: string;
  /** Can be updated from market API */
  current_price?: number;
  description?: string;
  id?: number;
  name?: string;
  /** Average purchase price */
  purchase_price?: number;
  quantity?: number;
  symbol?: string;
  updated_at?: string;
}

export interface ModelsWatchlist {
  /** "stock", "etf", "crypto" */
  asset_type?: string;
  created_at?: string;
  id?: number;
  name?: string;
  notes?: string;
  symbol?: string;
  updated_at?: string;
  user_id?: number;
}

export interface ResponseResponse {
  code?: number;
  data?: any;
  message?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "http://localhost:8080/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title TrackMyMoney API
 * @version 1.0
 * @license Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0.html)
 * @termsOfService http://swagger.io/terms/
 * @baseUrl http://localhost:8080/api
 * @contact API Support <support@swagger.io> (http://www.swagger.io/support)
 *
 * 资金收益追踪系统 API 文档
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * @description Get all financial accounts
     *
     * @tags accounts
     * @name AccountsList
     * @summary List accounts
     * @request GET:/api/accounts
     */
    accountsList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsAccount[];
        },
        any
      >({
        path: `/api/accounts`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new financial account
     *
     * @tags accounts
     * @name AccountsCreate
     * @summary Create account
     * @request POST:/api/accounts
     */
    accountsCreate: (
      account: HandlersCreateAccountRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsAccount;
        },
        any
      >({
        path: `/api/accounts`,
        method: "POST",
        body: account,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a financial account by ID
     *
     * @tags accounts
     * @name AccountsDetail
     * @summary Get account
     * @request GET:/api/accounts/{id}
     */
    accountsDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsAccount;
        },
        any
      >({
        path: `/api/accounts/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update a financial account
     *
     * @tags accounts
     * @name AccountsUpdate
     * @summary Update account
     * @request PUT:/api/accounts/{id}
     */
    accountsUpdate: (
      id: number,
      account: HandlersUpdateAccountRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsAccount;
        },
        any
      >({
        path: `/api/accounts/${id}`,
        method: "PUT",
        body: account,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a financial account
     *
     * @tags accounts
     * @name AccountsDelete
     * @summary Delete account
     * @request DELETE:/api/accounts/{id}
     */
    accountsDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/api/accounts/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get all cash assets
     *
     * @tags assets
     * @name AssetsCashList
     * @summary List cash assets
     * @request GET:/api/assets/cash
     */
    assetsCashList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsCashAsset[];
        },
        any
      >({
        path: `/api/assets/cash`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new cash asset
     *
     * @tags assets
     * @name AssetsCashCreate
     * @summary Create cash asset
     * @request POST:/api/assets/cash
     */
    assetsCashCreate: (
      asset: HandlersCreateCashAssetRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsCashAsset;
        },
        any
      >({
        path: `/api/assets/cash`,
        method: "POST",
        body: asset,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a cash asset by ID
     *
     * @tags assets
     * @name AssetsCashDetail
     * @summary Get cash asset
     * @request GET:/api/assets/cash/{id}
     */
    assetsCashDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsCashAsset;
        },
        any
      >({
        path: `/api/assets/cash/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update a cash asset
     *
     * @tags assets
     * @name AssetsCashUpdate
     * @summary Update cash asset
     * @request PUT:/api/assets/cash/{id}
     */
    assetsCashUpdate: (
      id: number,
      asset: HandlersUpdateCashAssetRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsCashAsset;
        },
        any
      >({
        path: `/api/assets/cash/${id}`,
        method: "PUT",
        body: asset,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a cash asset
     *
     * @tags assets
     * @name AssetsCashDelete
     * @summary Delete cash asset
     * @request DELETE:/api/assets/cash/{id}
     */
    assetsCashDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/api/assets/cash/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get all cryptocurrency assets
     *
     * @tags assets
     * @name AssetsCryptoList
     * @summary List crypto assets
     * @request GET:/api/assets/crypto
     */
    assetsCryptoList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsCryptoAsset[];
        },
        any
      >({
        path: `/api/assets/crypto`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new cryptocurrency asset
     *
     * @tags assets
     * @name AssetsCryptoCreate
     * @summary Create crypto asset
     * @request POST:/api/assets/crypto
     */
    assetsCryptoCreate: (
      asset: HandlersCreateCryptoAssetRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsCryptoAsset;
        },
        any
      >({
        path: `/api/assets/crypto`,
        method: "POST",
        body: asset,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Refresh current prices for all cryptocurrency assets from market data
     *
     * @tags assets
     * @name AssetsCryptoRefreshPricesCreate
     * @summary Refresh crypto prices
     * @request POST:/api/assets/crypto/refresh-prices
     */
    assetsCryptoRefreshPricesCreate: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: HandlersRefreshPricesResponse;
        },
        any
      >({
        path: `/api/assets/crypto/refresh-prices`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Get a cryptocurrency asset by ID
     *
     * @tags assets
     * @name AssetsCryptoDetail
     * @summary Get crypto asset
     * @request GET:/api/assets/crypto/{id}
     */
    assetsCryptoDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsCryptoAsset;
        },
        any
      >({
        path: `/api/assets/crypto/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update a cryptocurrency asset
     *
     * @tags assets
     * @name AssetsCryptoUpdate
     * @summary Update crypto asset
     * @request PUT:/api/assets/crypto/{id}
     */
    assetsCryptoUpdate: (
      id: number,
      asset: HandlersUpdateCryptoAssetRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsCryptoAsset;
        },
        any
      >({
        path: `/api/assets/crypto/${id}`,
        method: "PUT",
        body: asset,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a cryptocurrency asset
     *
     * @tags assets
     * @name AssetsCryptoDelete
     * @summary Delete crypto asset
     * @request DELETE:/api/assets/crypto/{id}
     */
    assetsCryptoDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/api/assets/crypto/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get all debt/liability assets
     *
     * @tags assets
     * @name AssetsDebtList
     * @summary List debt assets
     * @request GET:/api/assets/debt
     */
    assetsDebtList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsDebtAsset[];
        },
        any
      >({
        path: `/api/assets/debt`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new debt/liability asset
     *
     * @tags assets
     * @name AssetsDebtCreate
     * @summary Create debt asset
     * @request POST:/api/assets/debt
     */
    assetsDebtCreate: (
      asset: HandlersCreateDebtAssetRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsDebtAsset;
        },
        any
      >({
        path: `/api/assets/debt`,
        method: "POST",
        body: asset,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a debt/liability asset by ID
     *
     * @tags assets
     * @name AssetsDebtDetail
     * @summary Get debt asset
     * @request GET:/api/assets/debt/{id}
     */
    assetsDebtDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsDebtAsset;
        },
        any
      >({
        path: `/api/assets/debt/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update a debt/liability asset
     *
     * @tags assets
     * @name AssetsDebtUpdate
     * @summary Update debt asset
     * @request PUT:/api/assets/debt/{id}
     */
    assetsDebtUpdate: (
      id: number,
      asset: HandlersUpdateDebtAssetRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsDebtAsset;
        },
        any
      >({
        path: `/api/assets/debt/${id}`,
        method: "PUT",
        body: asset,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a debt/liability asset
     *
     * @tags assets
     * @name AssetsDebtDelete
     * @summary Delete debt asset
     * @request DELETE:/api/assets/debt/{id}
     */
    assetsDebtDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/api/assets/debt/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get historical assets data
     *
     * @tags assets
     * @name AssetsHistoryList
     * @summary Get assets history
     * @request GET:/api/assets/history
     */
    assetsHistoryList: (
      query?: {
        /**
         * Time period: 7d, 30d, 90d, 1y
         * @default "30d"
         */
        period?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: HandlersAssetHistoryResponse[];
        },
        any
      >({
        path: `/api/assets/history`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all interest-bearing assets
     *
     * @tags assets
     * @name AssetsInterestBearingList
     * @summary List interest-bearing assets
     * @request GET:/api/assets/interest-bearing
     */
    assetsInterestBearingList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsInterestBearingAsset[];
        },
        any
      >({
        path: `/api/assets/interest-bearing`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new interest-bearing asset (time deposit, bond, etc.)
     *
     * @tags assets
     * @name AssetsInterestBearingCreate
     * @summary Create interest-bearing asset
     * @request POST:/api/assets/interest-bearing
     */
    assetsInterestBearingCreate: (
      asset: HandlersCreateInterestBearingAssetRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsInterestBearingAsset;
        },
        any
      >({
        path: `/api/assets/interest-bearing`,
        method: "POST",
        body: asset,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get an interest-bearing asset by ID
     *
     * @tags assets
     * @name AssetsInterestBearingDetail
     * @summary Get interest-bearing asset
     * @request GET:/api/assets/interest-bearing/{id}
     */
    assetsInterestBearingDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsInterestBearingAsset;
        },
        any
      >({
        path: `/api/assets/interest-bearing/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update an interest-bearing asset
     *
     * @tags assets
     * @name AssetsInterestBearingUpdate
     * @summary Update interest-bearing asset
     * @request PUT:/api/assets/interest-bearing/{id}
     */
    assetsInterestBearingUpdate: (
      id: number,
      asset: HandlersUpdateInterestBearingAssetRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsInterestBearingAsset;
        },
        any
      >({
        path: `/api/assets/interest-bearing/${id}`,
        method: "PUT",
        body: asset,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete an interest-bearing asset
     *
     * @tags assets
     * @name AssetsInterestBearingDelete
     * @summary Delete interest-bearing asset
     * @request DELETE:/api/assets/interest-bearing/{id}
     */
    assetsInterestBearingDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/api/assets/interest-bearing/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get assets statistics aggregated by dimension (daily/weekly/monthly)
     *
     * @tags assets
     * @name AssetsStatisticsList
     * @summary Get assets statistics
     * @request GET:/api/assets/statistics
     */
    assetsStatisticsList: (
      query?: {
        /**
         * Aggregation dimension: daily, weekly, monthly
         * @default "daily"
         */
        dimension?: string;
        /**
         * Time period: 7d, 30d, 90d, 1y
         * @default "30d"
         */
        period?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: HandlersAssetStatisticsItem[];
        },
        any
      >({
        path: `/api/assets/statistics`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all stock/ETF assets
     *
     * @tags assets
     * @name AssetsStockList
     * @summary List stock assets
     * @request GET:/api/assets/stock
     */
    assetsStockList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsStockAsset[];
        },
        any
      >({
        path: `/api/assets/stock`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new stock/ETF asset
     *
     * @tags assets
     * @name AssetsStockCreate
     * @summary Create stock asset
     * @request POST:/api/assets/stock
     */
    assetsStockCreate: (
      asset: HandlersCreateStockAssetRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsStockAsset;
        },
        any
      >({
        path: `/api/assets/stock`,
        method: "POST",
        body: asset,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Refresh current prices for all stock assets from market data
     *
     * @tags assets
     * @name AssetsStockRefreshPricesCreate
     * @summary Refresh stock prices
     * @request POST:/api/assets/stock/refresh-prices
     */
    assetsStockRefreshPricesCreate: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: HandlersRefreshPricesResponse;
        },
        any
      >({
        path: `/api/assets/stock/refresh-prices`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Get a stock/ETF asset by ID
     *
     * @tags assets
     * @name AssetsStockDetail
     * @summary Get stock asset
     * @request GET:/api/assets/stock/{id}
     */
    assetsStockDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsStockAsset;
        },
        any
      >({
        path: `/api/assets/stock/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update a stock/ETF asset
     *
     * @tags assets
     * @name AssetsStockUpdate
     * @summary Update stock asset
     * @request PUT:/api/assets/stock/{id}
     */
    assetsStockUpdate: (
      id: number,
      asset: HandlersUpdateStockAssetRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsStockAsset;
        },
        any
      >({
        path: `/api/assets/stock/${id}`,
        method: "PUT",
        body: asset,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a stock/ETF asset
     *
     * @tags assets
     * @name AssetsStockDelete
     * @summary Delete stock asset
     * @request DELETE:/api/assets/stock/{id}
     */
    assetsStockDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/api/assets/stock/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get current assets summary including total assets, debt, and net assets
     *
     * @tags assets
     * @name AssetsSummaryList
     * @summary Get assets summary
     * @request GET:/api/assets/summary
     */
    assetsSummaryList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: HandlersAssetsSummaryResponse;
        },
        any
      >({
        path: `/api/assets/summary`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description User login
     *
     * @tags auth
     * @name AuthLoginCreate
     * @summary Login
     * @request POST:/api/auth/login
     */
    authLoginCreate: (
      credentials: HandlersLoginRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: HandlersLoginResponse;
        },
        any
      >({
        path: `/api/auth/login`,
        method: "POST",
        body: credentials,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Verify JWT token
     *
     * @tags auth
     * @name AuthVerifyList
     * @summary Verify token
     * @request GET:/api/auth/verify
     * @secure
     */
    authVerifyList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: HandlersUser;
        },
        any
      >({
        path: `/api/auth/verify`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all scheduled jobs
     *
     * @tags jobs
     * @name JobsList
     * @summary List scheduled jobs
     * @request GET:/api/jobs
     */
    jobsList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsScheduledJob[];
        },
        any
      >({
        path: `/api/jobs`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new scheduled job
     *
     * @tags jobs
     * @name JobsCreate
     * @summary Create scheduled job
     * @request POST:/api/jobs
     */
    jobsCreate: (
      job: HandlersCreateScheduledJobRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsScheduledJob;
        },
        any
      >({
        path: `/api/jobs`,
        method: "POST",
        body: job,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get execution logs for a scheduled job
     *
     * @tags jobs
     * @name JobsLogsList
     * @summary Get job execution logs
     * @request GET:/api/jobs/logs
     */
    jobsLogsList: (
      query?: {
        /** Filter by job name */
        job_name?: string;
        /**
         * Limit results
         * @default 50
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsJobExecutionLog[];
        },
        any
      >({
        path: `/api/jobs/logs`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a scheduled job by ID
     *
     * @tags jobs
     * @name JobsDetail
     * @summary Get scheduled job
     * @request GET:/api/jobs/{id}
     */
    jobsDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsScheduledJob;
        },
        any
      >({
        path: `/api/jobs/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update a scheduled job
     *
     * @tags jobs
     * @name JobsUpdate
     * @summary Update scheduled job
     * @request PUT:/api/jobs/{id}
     */
    jobsUpdate: (
      id: number,
      job: HandlersUpdateScheduledJobRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsScheduledJob;
        },
        any
      >({
        path: `/api/jobs/${id}`,
        method: "PUT",
        body: job,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a scheduled job
     *
     * @tags jobs
     * @name JobsDelete
     * @summary Delete scheduled job
     * @request DELETE:/api/jobs/{id}
     */
    jobsDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/api/jobs/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Manually trigger a scheduled job
     *
     * @tags jobs
     * @name JobsTriggerCreate
     * @summary Trigger scheduled job
     * @request POST:/api/jobs/{id}/trigger
     */
    jobsTriggerCreate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/api/jobs/${id}/trigger`,
        method: "POST",
        ...params,
      }),

    /**
     * @description Get all notification configurations
     *
     * @tags notifications
     * @name NotificationsList
     * @summary List notifications
     * @request GET:/api/notifications
     */
    notificationsList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsNotification[];
        },
        any
      >({
        path: `/api/notifications`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new notification configuration
     *
     * @tags notifications
     * @name NotificationsCreate
     * @summary Create notification
     * @request POST:/api/notifications
     */
    notificationsCreate: (
      notification: HandlersCreateNotificationRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsNotification;
        },
        any
      >({
        path: `/api/notifications`,
        method: "POST",
        body: notification,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a notification configuration by ID
     *
     * @tags notifications
     * @name NotificationsDetail
     * @summary Get notification
     * @request GET:/api/notifications/{id}
     */
    notificationsDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsNotification;
        },
        any
      >({
        path: `/api/notifications/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update a notification configuration
     *
     * @tags notifications
     * @name NotificationsUpdate
     * @summary Update notification
     * @request PUT:/api/notifications/{id}
     */
    notificationsUpdate: (
      id: number,
      notification: HandlersUpdateNotificationRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsNotification;
        },
        any
      >({
        path: `/api/notifications/${id}`,
        method: "PUT",
        body: notification,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a notification configuration
     *
     * @tags notifications
     * @name NotificationsDelete
     * @summary Delete notification
     * @request DELETE:/api/notifications/{id}
     */
    notificationsDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/api/notifications/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Send a test notification
     *
     * @tags notifications
     * @name NotificationsTestCreate
     * @summary Test notification
     * @request POST:/api/notifications/{id}/test
     */
    notificationsTestCreate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/api/notifications/${id}/test`,
        method: "POST",
        ...params,
      }),
  };
  market = {
    /**
     * @description Get historical price data for a stock or crypto
     *
     * @tags Market
     * @name HistoryDetail
     * @summary Get historical price data
     * @request GET:/market/history/{symbol}
     */
    historyDetail: (
      symbol: string,
      query?: {
        /**
         * Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
         * @default "1mo"
         */
        period?: string;
        /**
         * Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
         * @default "1d"
         */
        interval?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsHistoryResponse;
        },
        ResponseResponse
      >({
        path: `/market/history/${symbol}`,
        method: "GET",
        query: query,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get basic information about a stock or cryptocurrency
     *
     * @tags Market
     * @name InfoDetail
     * @summary Get stock/crypto information
     * @request GET:/market/info/{symbol}
     */
    infoDetail: (symbol: string, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsInfoResponse;
        },
        ResponseResponse
      >({
        path: `/market/info/${symbol}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get real-time quote for a single stock or crypto symbol
     *
     * @tags Market
     * @name QuoteDetail
     * @summary Get real-time quote
     * @request GET:/market/quote/{symbol}
     */
    quoteDetail: (symbol: string, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsQuote;
        },
        ResponseResponse
      >({
        path: `/market/quote/${symbol}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get quotes for multiple symbols at once
     *
     * @tags Market
     * @name QuotesCreate
     * @summary Get batch quotes
     * @request POST:/market/quotes
     */
    quotesCreate: (body: ModelsQuotesRequest, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsQuotesResponse;
        },
        ResponseResponse
      >({
        path: `/market/quotes`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Search for stocks or cryptocurrencies by name or symbol
     *
     * @tags Market
     * @name SearchList
     * @summary Search stocks/crypto
     * @request GET:/market/search
     */
    searchList: (
      query: {
        /**
         * Search query
         * @minLength 1
         */
        q: string;
        /**
         * Maximum number of results
         * @min 1
         * @max 50
         * @default 10
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsSearchResponse;
        },
        ResponseResponse
      >({
        path: `/market/search`,
        method: "GET",
        query: query,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  watchlist = {
    /**
     * @description Get all watchlist items for the current user
     *
     * @tags Watchlist
     * @name WatchlistList
     * @summary Get user's watchlist
     * @request GET:/watchlist
     */
    watchlistList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsWatchlist[];
        },
        ResponseResponse
      >({
        path: `/watchlist`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Add a new stock or crypto to user's watchlist
     *
     * @tags Watchlist
     * @name WatchlistCreate
     * @summary Create watchlist item
     * @request POST:/watchlist
     */
    watchlistCreate: (
      body: HandlersCreateWatchlistRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        ResponseResponse & {
          data?: ModelsWatchlist;
        },
        ResponseResponse
      >({
        path: `/watchlist`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all watchlist items with real-time market quotes
     *
     * @tags Watchlist
     * @name QuotesList
     * @summary Get watchlist with real-time quotes
     * @request GET:/watchlist/quotes
     */
    quotesList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: Record<string, any>[];
        },
        ResponseResponse
      >({
        path: `/watchlist/quotes`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a specific watchlist item by ID
     *
     * @tags Watchlist
     * @name WatchlistDetail
     * @summary Get watchlist item by ID
     * @request GET:/watchlist/{id}
     */
    watchlistDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: ModelsWatchlist;
        },
        ResponseResponse
      >({
        path: `/watchlist/${id}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a watchlist item (currently only notes)
     *
     * @tags Watchlist
     * @name WatchlistUpdate
     * @summary Update watchlist item
     * @request PUT:/watchlist/{id}
     */
    watchlistUpdate: (
      id: number,
      body: HandlersUpdateWatchlistRequest,
      params: RequestParams = {},
    ) =>
      this.request<ResponseResponse, ResponseResponse>({
        path: `/watchlist/${id}`,
        method: "PUT",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Remove a stock or crypto from user's watchlist
     *
     * @tags Watchlist
     * @name WatchlistDelete
     * @summary Delete watchlist item
     * @request DELETE:/watchlist/{id}
     */
    watchlistDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseResponse>({
        path: `/watchlist/${id}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
