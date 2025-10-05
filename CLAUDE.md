# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TrackMyMoney is a full-stack financial asset tracking system with a **React 19 + TypeScript** frontend and a **Golang 1.25 + Gin** backend. The project uses MSW for API mocking during frontend development, enabling complete frontend-backend decoupling.

## Development Commands

### Starting the Application

```bash
make web          # Frontend with MSW Mock (port 3000) - for pure frontend dev
make web-prod     # Frontend connecting to real backend (port 3000)
make server       # Backend API server (port 8080)
```

**Important**: `make web` uses MSW Mock by default. Use `make web-prod` for frontend-backend integration, but ensure backend is running first.

### Code Generation

```bash
make gen          # Generate OpenAPI docs + TypeScript types
make gen-openapi  # Generate OpenAPI docs only
make gen-types    # Generate TypeScript types only
```

**When to run**: After modifying any backend API handler or Swagger annotations. This keeps frontend types synchronized with backend.

### Build & Lint

```bash
make build              # Build both frontend and backend
make build-frontend     # Build frontend → frontend/dist
make build-backend      # Build backend → backend/bin/trackmymoney
make lint-frontend      # Run ESLint on frontend
```

### Installation & Cleanup

```bash
make install-tools      # Install swag, swagger-typescript-api, and dependencies
make clean              # Remove generated files
make clean-all          # Remove generated files + node_modules/vendor
```

## Architecture

### Frontend Architecture

**Service Layer Pattern**:
- `BaseService` (generic, type-safe) → Feature services (CashAssetService, StockAssetService, etc.)
- All services use consistent `ApiResponse<T>` wrapper: `{ code, message, data }`
- JWT token auto-injected via `Authorization: Bearer ${token}` header
- Services inherit protected methods: `get<T>()`, `post<T,D>()`, `put<T,D>()`, `delete<T>()`
- Each asset type has its own service: CashAssetService, InterestBearingAssetService, StockAssetService, DebtAssetService, CryptoAssetService

**State Management**:
- Zustand stores for each domain: `authStore`, `cashAssetStore`, `stockAssetStore`, `assetsStore`, `dataSourceStore`, `notificationStore`
- `authStore` uses persist middleware to store JWT token in localStorage
- Each store follows pattern: `{ data, loading, error, fetch*(), create*(), update*(), delete*() }`
- Separate stores for each asset type to manage data independently

**MSW Mock Layer**:
- Lives in `frontend/src/mocks/handlers/`
- Each asset type has a handler file (cash-assets.ts, stock-assets.ts, etc.)
- Mock data structure **must match** backend API response format exactly
- Controlled by `VITE_USE_MOCK` env var (auto-enabled in DEV mode)
- MSW initialization in `main.tsx` via `enableMocking()` function

**Routing**:
- React Router with `ProtectedRoute` wrapper for authenticated routes
- `BasicLayout` (ProLayout) wraps all authenticated pages
- Auto-redirects to `/login` if not authenticated

### Backend Architecture

**Standard Gin Project Structure**:
```
backend/
├── cmd/api/main.go          # Entry point with Swagger docs
├── internal/
│   ├── handlers/            # Gin handlers with Swagger annotations
│   ├── models/              # GORM models
│   ├── database/            # DB initialization & migration
│   └── config/              # YAML config loader
├── pkg/
│   ├── response/            # Unified response wrapper
│   └── logger/              # Zap logger wrapper
└── config.yaml              # Runtime configuration
```

**Response Format Convention**:
- All API responses use `response.Success(c, data)` or `response.Error(c, code, msg)`
- Response structure: `{ "code": 0, "message": "success", "data": {...} }`
- Frontend `BaseService` unwraps `response.data` automatically

**Database**:
- SQLite with GORM ORM
- Auto-migration on startup in `database.Init()`
- Models use embedded `BaseModel` for common fields (ID, CreatedAt, UpdatedAt, DeletedAt)

**Authentication**:
- JWT-based auth configured in `config.yaml` with hardcoded credentials (admin/admin123)
- Token stored in localStorage on frontend
- `handlers.SetConfig()` must be called before routing setup

### Asset Management System

The system uses **分表存储** strategy with **5 independent asset types**, each with its own table, API endpoints, service, and mock handlers:

1. **CashAsset (现金资产)** - `/api/assets/cash`
   - Fields: `name`, `amount`, `currency`, `data_source_id`, `description`
   - Table: `cash_assets`

2. **InterestBearingAsset (计息资产)** - `/api/assets/interest-bearing`
   - Fields: `name`, `amount`, `currency`, `interest_rate`, `start_date`, `maturity_date`
   - Use cases: 定期存款、债券等
   - Table: `interest_bearing_assets`

3. **StockAsset (股票资产)** - `/api/assets/stock`
   - Fields: `name`, `broker_account`, `symbol`, `quantity`, `purchase_price`, `current_price`
   - Table: `stock_assets`

4. **DebtAsset (债务资产)** - `/api/assets/debt`
   - Fields: `name`, `amount`, `creditor`, `interest_rate`, `due_date`
   - Table: `debt_assets`

5. **CryptoAsset (加密货币资产)** - `/api/assets/crypto`
   - Fields: `name`, `symbol`, `quantity`, `purchase_price`, `current_price`
   - Table: `crypto_assets`

**Backend Architecture**:
- Each asset type has its own GORM model in `models/asset.go`
- Separate handler files: `cash_asset.go`, `interest_bearing_asset.go`, `stock_asset.go`, `debt_asset.go`, `crypto_asset.go`
- Unified asset summary/history endpoints: `/api/assets/summary`, `/api/assets/history`
- Asset snapshots use polymorphic association: `AssetSnapshot` with `asset_type` + `asset_id`

**Frontend Architecture**:
- Separate services: `CashAssetService`, `InterestBearingAssetService`, etc.
- Separate mock handlers: `cash-assets.ts`, `interest-bearing-assets.ts`, etc.
- Asset summary aggregates data from all 5 mock data sources
- Zustand stores: one store per asset type for independent state management

**API Endpoints Pattern**:
- `POST /api/assets/{type}` - Create asset
- `GET /api/assets/{type}` - List all assets of type
- `GET /api/assets/{type}/:id` - Get asset by ID
- `PUT /api/assets/{type}/:id` - Update asset
- `DELETE /api/assets/{type}/:id` - Delete asset

## Critical Patterns

### Adding a New API Endpoint

1. **Backend** (`backend/internal/handlers/feature.go`):
   ```go
   // @Summary Your endpoint description
   // @Description Detailed description
   // @Tags feature
   // @Accept json
   // @Produce json
   // @Param body body YourRequest true "Request body"
   // @Success 200 {object} response.Response{data=YourResponse}
   // @Router /feature [post]
   func CreateFeature(c *gin.Context) {
       // Implementation
       response.Success(c, data)
   }
   ```

2. **Register route** in `cmd/api/main.go` → `setupRoutes()`

3. **Generate types**: `make gen`

4. **Create MSW mock** (`frontend/src/mocks/handlers/feature.ts`):
   ```typescript
   http.post('/api/feature', async ({ request }) => {
       const body = await request.json();
       return HttpResponse.json({
           code: 0,
           message: 'success',
           data: mockData
       });
   })
   ```

5. **Create frontend service** extending `BaseService`:
   ```typescript
   export class FeatureService extends BaseService {
       async createFeature(data: CreateRequest): Promise<Response> {
           return this.post<Response>('/feature', data);
       }
   }
   ```

6. **Update handlers index**: `frontend/src/mocks/handlers/index.ts`

### MSW Mock Development Rules

1. **Every backend API must have a corresponding MSW mock** before frontend development
2. Mock response format must match backend exactly: `{ code: 0, message: "success", data: {...} }`
3. Mock handlers stored in `frontend/src/mocks/handlers/[feature].ts`
4. Export handlers array and import in `frontend/src/mocks/handlers/index.ts`
5. When backend API changes, update mock immediately

### Logging Standards

**Frontend**: Use custom logger (`@/utils/logger`) instead of `console.log`
- ESLint rule enforces: `no-console: 'warn'`
- Methods: `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`

**Backend**: Use Zap logger wrapper (`pkg/logger`)
- Methods: `logger.Debug()`, `logger.Info()`, `logger.Warn()`, `logger.Error()`, `logger.Fatal()`
- Configured in `config.yaml` with file rotation (lumberjack)

## Configuration

### Frontend Environment Variables

- `VITE_USE_MOCK=false` - Disable MSW Mock (used by `make web-prod`)
- Default behavior: MSW enabled in DEV mode

### Backend Configuration

Edit `backend/config.yaml`:
- `server.port` - Default: "8080"
- `server.mode` - "debug", "release", or "test"
- `database.dsn` - SQLite file path
- `auth.*` - Login credentials and JWT secret
- `log.*` - Log level and rotation settings

**Default credentials**: `admin` / `admin123`

## Code Quality

- **TypeScript**: Strict mode enabled (`noImplicitAny`, `strictNullChecks`)
- **ESLint**: `@typescript-eslint/no-explicit-any` is error (no `any` types allowed)
- **Frontend logging**: `no-console` enforced - use `logger` utility
- **Type generation**: Run `make gen` after backend changes to maintain type safety

## OpenAPI Documentation

- Generated files: `backend/docs/swagger.{json,yaml}`
- Swagger annotations in all handler files
- Main API info in `backend/cmd/api/main.go`
- TypeScript types auto-generated to `frontend/src/types/generated/`

## Development Workflow

**Typical workflow for new feature**:
1. Start frontend in mock mode: `make web`
2. Develop UI with mock data
3. Implement backend API with Swagger annotations
4. Generate types: `make gen`
5. Create MSW mock matching backend
6. Test integration: `make server` + `make web-prod`
7. Verify frontend types match backend response

**Frontend-only development**:
- Use `make web` exclusively
- No backend needed
- MSW provides realistic API responses

**Backend API modification**:
- Update Swagger annotations
- Run `make gen` to regenerate types
- Update corresponding MSW mock
- Verify frontend service still compiles

# Important
Always response with Chinese.