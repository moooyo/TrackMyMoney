# TrackMyMoney Services 启动指南

## 🎯 快速开始

### 一键启动所有服务（推荐）

```bash
make server
```

这个命令会：
1. 自动检查并安装 Python 依赖（如果需要）
2. 在后台启动 Market 服务（端口 5000）
3. 在前台启动 API Server（端口 8080）
4. 按 `Ctrl+C` 时会自动清理所有进程

### 服务端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| Market Service (Python) | 5000 | 市场数据服务，使用 yfinance 获取股票/加密货币数据 |
| API Server (Go) | 8080 | 主 API 服务器，封装 Market 服务并提供统一接口 |

### 端口配置文件

**Market 服务监听端口**：
- 文件：`backend/market/config.py`
- 配置：`port: int = 5000`
- 环境变量：`MARKET_PORT=5000`

**API Server Market 服务地址**：
- 文件：`backend/config.yaml`
- 配置：`market.base_url: "http://localhost:5000"`

## 📋 可用命令

### 启动服务

```bash
# 启动所有服务（Market + API Server）
make server

# 仅启动 API Server（需要手动启动 Market）
make server-only

# 仅启动 Market 服务（前台运行）
make market

# 启动 Market 服务（开发模式，自动重载）
make market-dev
```

### 停止服务

```bash
# 停止所有后台服务
make stop-services

# 如果使用 make server 启动，直接按 Ctrl+C 即可停止所有服务
```

### 安装依赖

```bash
# 安装 Market 服务 Python 依赖
make market-install

# 或者手动安装
cd backend/market
pip3 install -r requirements.txt
```

## 🔍 服务健康检查

### Market 服务

```bash
# 检查 Market 服务是否运行
curl http://localhost:5000/health

# 预期响应
{"status":"healthy","service":"market"}
```

### API Server

```bash
# 检查 API Server 是否运行
curl http://localhost:8080/health

# 预期响应
{"status":"ok"}
```

### Market API 测试

```bash
# 通过 API Server 获取股票报价
curl http://localhost:8080/api/market/quote/AAPL

# 批量获取报价
curl -X POST http://localhost:8080/api/market/quotes \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL", "MSFT", "BTC-USD"]}'

# 获取历史数据
curl "http://localhost:8080/api/market/history/AAPL?period=1mo&interval=1d"
```

## 🐛 故障排查

### Market 服务启动失败

**问题**：Market 服务无法启动

**解决方案**：
1. 检查 Python 依赖是否安装：
   ```bash
   make market-install
   ```

2. 检查端口 5000 是否被占用：
   ```bash
   lsof -i :5000
   ```

3. 查看 Market 服务日志：
   ```bash
   cat /tmp/trackmymoney-market.log
   ```

### API Server 连接 Market 失败

**问题**：API Server 无法连接到 Market 服务

**解决方案**：
1. 确认 Market 服务是否运行：
   ```bash
   curl http://localhost:5000/health
   ```

2. 检查配置文件 `backend/config.yaml`：
   ```yaml
   market:
     base_url: "http://localhost:5000"  # 确保地址正确
     timeout: 30
     max_retries: 3
   ```

3. 检查防火墙设置（如果使用 WSL）

### 端口冲突

**问题**：端口 5000 或 8080 已被占用

**解决方案**：

**修改 Market 服务端口**（假设改为 5001）：
1. 修改 `backend/market/config.py`：
   ```python
   port: int = 5001
   ```
2. 修改 `backend/config.yaml`：
   ```yaml
   market:
     base_url: "http://localhost:5001"
   ```

**修改 API Server 端口**（假设改为 8081）：
1. 修改 `backend/config.yaml`：
   ```yaml
   server:
     port: "8081"
   ```

## 📊 日志位置

- **Market 服务日志**（后台运行时）：`/tmp/trackmymoney-market.log`
- **Market PID 文件**：`/tmp/trackmymoney-market.pid`
- **API Server 日志**：`backend/logs/app.log`（配置在 config.yaml）

## 🔄 开发工作流

### 前端开发（使用 Mock 数据）

```bash
# 终端 1：启动前端（使用 MSW Mock，无需后端）
make web
```

### 全栈开发（真实后端）

```bash
# 终端 1：启动所有后端服务
make server

# 终端 2：启动前端（连接真实后端）
make web-prod
```

### 仅开发 Market 服务

```bash
# 终端 1：启动 Market 服务（开发模式，代码修改自动重载）
make market-dev

# 终端 2：测试 Market API
curl http://localhost:5000/api/market/quote/AAPL
```

## 🚀 生产环境部署建议

1. **使用环境变量覆盖配置**：
   ```bash
   export MARKET_PORT=5000
   export MARKET_DEBUG=false
   ```

2. **使用进程管理工具**：
   - systemd
   - supervisor
   - PM2

3. **使用反向代理**：
   - Nginx
   - Caddy
   - Traefik

4. **容器化部署**：
   ```dockerfile
   # 可以为 Market 服务创建 Dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY backend/market/requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY backend/market/ .
   CMD ["python", "main.py"]
   ```

## 📚 相关文档

- [项目主 README](../README.md)
- [Makefile 使用指南](../MAKEFILE_GUIDE.md)
- [开发指南](../CLAUDE.md)
- [yfinance 官方文档](https://ranaroussi.github.io/yfinance/)
