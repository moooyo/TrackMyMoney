.PHONY: web web-prod server server-only yfinance yfinance-dev yfinance-install stop-services gen gen-openapi gen-types install-tools help clean

# Default target
.DEFAULT_GOAL := help

# Colors for output
COLOR_RESET = \033[0m
COLOR_BOLD = \033[1m
COLOR_GREEN = \033[32m
COLOR_YELLOW = \033[33m
COLOR_BLUE = \033[34m

# Project directories
FRONTEND_DIR = frontend
BACKEND_DIR = backend
YFINANCE_DIR = yfinanceAPI
DOCS_DIR = $(BACKEND_DIR)/docs
TYPES_DIR = $(FRONTEND_DIR)/src/types

# Tools
SWAG = $(HOME)/go/bin/swag
NPM = npm
GO = go

##@ Development

web: ## 启动前端项目（Mock 模式）
	@echo "$(COLOR_GREEN)$(COLOR_BOLD)🚀 Starting frontend in MOCK mode...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && VITE_USE_MOCK=true $(NPM) run dev

web-prod: ## 启动前端项目（连接真实后端）
	@echo "$(COLOR_GREEN)$(COLOR_BOLD)🚀 Starting frontend in PRODUCTION mode (connecting to real backend)...$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)⚠️  Make sure backend is running on http://localhost:8080$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && VITE_USE_MOCK=false $(NPM) run dev

server: ## 启动所有服务（yfinanceAPI + API Server）
	@echo "$(COLOR_GREEN)$(COLOR_BOLD)🚀 Starting all services (yfinanceAPI + API Server)...$(COLOR_RESET)"
	@echo "$(COLOR_BLUE)  yfinanceAPI: http://127.0.0.1:5000 (internal only)$(COLOR_RESET)"
	@echo "$(COLOR_BLUE)  API Server:  http://localhost:8080 (public)$(COLOR_RESET)"
	@echo "$(COLOR_BLUE)  WebSocket:   ws://localhost:8080/ws/market/{{symbol}} (proxied)$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)⚠️  Press Ctrl+C to stop all services$(COLOR_RESET)"
	@$(BACKEND_DIR)/scripts/start-services.sh

server-only: ## 仅启动后端 API 服务（不启动 yfinanceAPI）
	@echo "$(COLOR_GREEN)$(COLOR_BOLD)🚀 Starting backend API server only...$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)⚠️  Make sure yfinanceAPI service is running on http://localhost:5000$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && $(GO) run cmd/api/main.go

yfinance: ## 启动 yfinanceAPI 服务（REST API + WebSocket）
	@echo "$(COLOR_GREEN)$(COLOR_BOLD)🚀 Starting yfinanceAPI service...$(COLOR_RESET)"
	@echo "$(COLOR_BLUE)  Service: http://127.0.0.1:5000 (internal only)$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)⚠️  This service is for backend use only. Frontend connects via backend proxy.$(COLOR_RESET)"
	@cd $(YFINANCE_DIR) && ./venv/bin/python main.py

yfinance-dev: ## 启动 yfinanceAPI 服务（开发模式，自动重载）
	@echo "$(COLOR_GREEN)$(COLOR_BOLD)🚀 Starting yfinanceAPI service in development mode...$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)⚠️  yfinanceAPI service will run on http://localhost:5000$(COLOR_RESET)"
	@cd $(YFINANCE_DIR) && ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 5000 --reload

yfinance-install: ## 安装 yfinanceAPI 服务依赖
	@echo "$(COLOR_BLUE)📦 Installing yfinanceAPI service dependencies...$(COLOR_RESET)"
	@if ! command -v python3 &> /dev/null; then \
		echo "$(COLOR_YELLOW)⚠️  Python3 not found. Please install Python 3.8 or higher.$(COLOR_RESET)"; \
		exit 1; \
	fi
	@cd $(YFINANCE_DIR) && \
		if [ ! -d "venv" ]; then python3 -m venv venv; fi && \
		./venv/bin/pip install -r requirements.txt
	@echo "$(COLOR_GREEN)✅ yfinanceAPI service dependencies installed!$(COLOR_RESET)"

stop-services: ## 停止所有后台服务
	@echo "$(COLOR_YELLOW)🛑 Stopping all services...$(COLOR_RESET)"
	@if [ -f /tmp/trackmymoney-yfinance.pid ]; then \
		YFINANCE_PID=$$(cat /tmp/trackmymoney-yfinance.pid); \
		if ps -p $$YFINANCE_PID > /dev/null 2>&1; then \
			echo "$(COLOR_BLUE)Stopping yfinanceAPI service (PID: $$YFINANCE_PID)...$(COLOR_RESET)"; \
			kill $$YFINANCE_PID 2>/dev/null || true; \
			sleep 1; \
			if ps -p $$YFINANCE_PID > /dev/null 2>&1; then \
				kill -9 $$YFINANCE_PID 2>/dev/null || true; \
			fi; \
			echo "$(COLOR_GREEN)✅ yfinanceAPI service stopped$(COLOR_RESET)"; \
		fi; \
		rm -f /tmp/trackmymoney-yfinance.pid; \
	else \
		echo "$(COLOR_YELLOW)No running yfinanceAPI service found$(COLOR_RESET)"; \
	fi
	@echo "$(COLOR_GREEN)✅ All services stopped$(COLOR_RESET)"

##@ Code Generation

gen: gen-openapi gen-types ## 生成 OpenAPI 文档和前端类型定义
	@echo "$(COLOR_GREEN)$(COLOR_BOLD)✅ Code generation completed!$(COLOR_RESET)"

gen-openapi: ## 生成 OpenAPI 文档
	@echo "$(COLOR_BLUE)$(COLOR_BOLD)📝 Generating OpenAPI documentation...$(COLOR_RESET)"
	@if [ ! -f "$(SWAG)" ]; then \
		echo "$(COLOR_YELLOW)⚠️  swag not found, installing...$(COLOR_RESET)"; \
		$(GO) install github.com/swaggo/swag/cmd/swag@latest; \
	fi
	@cd $(BACKEND_DIR) && $(SWAG) init -g cmd/api/main.go --output docs
	@echo "$(COLOR_GREEN)✅ OpenAPI documentation generated at $(DOCS_DIR)/swagger.json$(COLOR_RESET)"

gen-types: gen-openapi ## 从 OpenAPI 文档生成前端类型
	@echo "$(COLOR_BLUE)$(COLOR_BOLD)📝 Generating TypeScript types from OpenAPI...$(COLOR_RESET)"
	@if ! command -v swagger-typescript-api &> /dev/null; then \
		echo "$(COLOR_YELLOW)⚠️  swagger-typescript-api not found, installing globally...$(COLOR_RESET)"; \
		npm install -g swagger-typescript-api; \
	fi
	@mkdir -p $(TYPES_DIR)/generated
	@swagger-typescript-api generate \
		-p $(DOCS_DIR)/swagger.json \
		-o $(TYPES_DIR)/generated \
		--axios
	@echo "$(COLOR_GREEN)✅ TypeScript types generated at $(TYPES_DIR)/generated$(COLOR_RESET)"

##@ Tools & Setup

install-tools: ## 安装所有必需的工具
	@echo "$(COLOR_BLUE)$(COLOR_BOLD)📦 Installing required tools...$(COLOR_RESET)"
	@echo "Installing swag..."
	@$(GO) install github.com/swaggo/swag/cmd/swag@latest
	@echo "Installing swagger-typescript-api..."
	@npm install -g swagger-typescript-api
	@echo "Installing frontend dependencies..."
	@cd $(FRONTEND_DIR) && $(NPM) install
	@echo "Installing backend dependencies..."
	@cd $(BACKEND_DIR) && $(GO) mod download
	@echo "$(COLOR_GREEN)$(COLOR_BOLD)✅ All tools installed!$(COLOR_RESET)"

install-frontend: ## 安装前端依赖
	@echo "$(COLOR_BLUE)📦 Installing frontend dependencies...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) install

install-backend: ## 安装后端依赖
	@echo "$(COLOR_BLUE)📦 Installing backend dependencies...$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && $(GO) mod download

install-yfinance: yfinance-install ## 安装 yfinanceAPI 服务依赖（别名）

##@ Build & Test

build-frontend: ## 构建前端项目
	@echo "$(COLOR_BLUE)$(COLOR_BOLD)🔨 Building frontend...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run build
	@echo "$(COLOR_GREEN)✅ Frontend built successfully!$(COLOR_RESET)"

build-backend: ## 构建后端项目
	@echo "$(COLOR_BLUE)$(COLOR_BOLD)🔨 Building backend...$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && $(GO) build -o bin/trackmymoney cmd/api/main.go
	@echo "$(COLOR_GREEN)✅ Backend built successfully at $(BACKEND_DIR)/bin/trackmymoney$(COLOR_RESET)"

build: build-backend build-frontend ## 构建前后端项目

lint-frontend: ## 检查前端代码规范
	@echo "$(COLOR_BLUE)🔍 Linting frontend code...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run lint

##@ Utilities

clean: ## 清理生成的文件
	@echo "$(COLOR_YELLOW)🧹 Cleaning generated files...$(COLOR_RESET)"
	@rm -rf $(DOCS_DIR)
	@rm -rf $(TYPES_DIR)/generated
	@rm -rf $(BACKEND_DIR)/bin
	@rm -rf $(FRONTEND_DIR)/dist
	@echo "$(COLOR_GREEN)✅ Cleanup completed!$(COLOR_RESET)"

clean-all: clean ## 清理所有文件（包括依赖）
	@echo "$(COLOR_YELLOW)🧹 Cleaning all files including dependencies...$(COLOR_RESET)"
	@rm -rf $(FRONTEND_DIR)/node_modules
	@rm -rf $(BACKEND_DIR)/vendor
	@echo "$(COLOR_GREEN)✅ Full cleanup completed!$(COLOR_RESET)"

##@ Help

help: ## 显示帮助信息
	@echo ""
	@echo "$(COLOR_BOLD)TrackMyMoney - Makefile Commands$(COLOR_RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(COLOR_GREEN)%-20s$(COLOR_RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(COLOR_BOLD)%s$(COLOR_RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(COLOR_BOLD)Examples:$(COLOR_RESET)"
	@echo "  make web           # 启动前端（Mock 模式）"
	@echo "  make web-prod      # 启动前端（连接真实后端）"
	@echo "  make server        # 启动后端服务器"
	@echo "  make gen           # 生成文档和类型"
	@echo ""
