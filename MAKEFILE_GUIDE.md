# Makefile 使用指南

## 🎯 核心命令

### 1️⃣ `make web` - 启动前端（Mock 模式）

```bash
make web
```

**功能：**
- 启动前端开发服务器（http://localhost:3000）
- **自动启用 MSW Mock**
- 所有 API 请求返回 Mock 数据
- 无需启动后端服务器

**使用场景：**
- ✅ 纯前端 UI 开发
- ✅ 前端组件调试
- ✅ 在没有后端的情况下演示前端功能

---

### 2️⃣ `make web-prod` - 启动前端（正常模式）

```bash
make web-prod
```

**功能：**
- 启动前端开发服务器（http://localhost:3000）
- **禁用 MSW Mock**
- API 请求发送到真实后端（http://localhost:8080）
- **需要先启动后端服务器**

**使用场景：**
- ✅ 前后端联调
- ✅ 测试真实 API 交互
- ✅ 集成测试

**⚠️ 注意：**
使用此命令前，请确保后端已启动：
```bash
# Terminal 1
make server

# Terminal 2
make web-prod
```

---

### 3️⃣ `make server` - 启动后端

```bash
make server
```

**功能：**
- 启动 Golang 后端服务器（http://localhost:8080）
- 自动连接 SQLite 数据库
- 提供完整的 RESTful API

**API 端点：**
- `POST /api/auth/login` - 登录
- `GET /api/accounts` - 获取账目列表
- `GET /api/assets/summary` - 资产统计
- `GET /api/datasources` - 数据源列表
- `GET /api/notifications` - 推送配置列表
- 更多端点见 OpenAPI 文档

---

### 4️⃣ `make gen` - 生成文档和类型

```bash
make gen
```

**功能：**
1. **生成 OpenAPI 文档**
   - 扫描后端 Swagger 注释
   - 生成 `backend/docs/swagger.json`
   - 生成 `backend/docs/swagger.yaml`

2. **生成前端 TypeScript 类型**
   - 读取 OpenAPI 文档
   - 自动生成类型定义
   - 输出到 `frontend/src/types/generated/`

**何时使用：**
- ✅ 修改后端 API 后
- ✅ 添加新的接口
- ✅ 更新请求/响应结构
- ✅ 确保前后端类型同步

**工作流程：**
```bash
# 1. 修改后端代码（如 handlers/account.go）
# 2. 更新 Swagger 注释
# 3. 运行生成命令
make gen

# 4. 检查生成的文件
ls backend/docs/
ls frontend/src/types/generated/
```

---

## 📋 完整命令列表

运行 `make help` 查看所有可用命令：

```bash
make help
```

输出示例：
```
TrackMyMoney - Makefile Commands

Development
  web                  启动前端项目（Mock 模式）
  web-prod             启动前端项目（连接真实后端）
  server               启动后端项目

Code Generation
  gen                  生成 OpenAPI 文档和前端类型定义
  gen-openapi          生成 OpenAPI 文档
  gen-types            从 OpenAPI 文档生成前端类型

Tools & Setup
  install-tools        安装所有必需的工具
  install-frontend     安装前端依赖
  install-backend      安装后端依赖

Build & Test
  build-frontend       构建前端项目
  build-backend        构建后端项目
  build                构建前后端项目
  lint-frontend        检查前端代码规范

Utilities
  clean                清理生成的文件
  clean-all            清理所有文件（包括依赖）

Help
  help                 显示帮助信息
```

---

## 🔧 工具安装命令

### 安装所有工具

```bash
make install-tools
```

这会安装：
- ✅ swag（OpenAPI 文档生成）
- ✅ swagger-typescript-api（类型生成）
- ✅ 前端依赖（npm install）
- ✅ 后端依赖（go mod download）

### 分别安装

```bash
make install-frontend    # 只安装前端依赖
make install-backend     # 只安装后端依赖
```

---

## 🏗️ 构建命令

### 构建生产版本

```bash
make build              # 构建前后端
make build-frontend     # 只构建前端（输出到 frontend/dist）
make build-backend      # 只构建后端（输出到 backend/bin/trackmymoney）
```

### 运行生产版本

```bash
# 运行构建的后端
./backend/bin/trackmymoney

# 前端需要使用静态服务器
cd frontend/dist
python3 -m http.server 3000
```

---

## 🧹 清理命令

### 清理生成的文件

```bash
make clean
```

清理：
- `backend/docs/` - OpenAPI 文档
- `frontend/src/types/generated/` - 生成的类型
- `backend/bin/` - 后端可执行文件
- `frontend/dist/` - 前端构建产物

### 完全清理（包括依赖）

```bash
make clean-all
```

额外清理：
- `frontend/node_modules/`
- `backend/vendor/`

⚠️ **警告**：清理后需要重新运行 `make install-tools`

---

## 🎬 常见工作流程

### 场景 1：开始新的功能开发（前端）

```bash
# 1. 启动前端 Mock 模式
make web

# 2. 开发前端组件
# 3. 使用 MSW Mock 数据测试
```

### 场景 2：前后端联调

```bash
# Terminal 1 - 启动后端
make server

# Terminal 2 - 启动前端（连接真实后端）
make web-prod

# 3. 测试完整功能流程
```

### 场景 3：添加新的 API

```bash
# 1. 在后端添加新的 handler
vim backend/internal/handlers/newfeature.go

# 2. 添加 Swagger 注释
# @Summary Create new feature
# @Description Create a new feature
# ...

# 3. 生成文档和类型
make gen

# 4. 在前端使用新生成的类型
vim frontend/src/services/NewFeatureService.ts

# 5. 测试
make server          # Terminal 1
make web-prod        # Terminal 2
```

---

## 🐛 故障排查

### 问题 1：`make gen` 失败

**错误信息：** `swag: command not found`

**解决方案：**
```bash
make install-tools
# 或
go install github.com/swaggo/swag/cmd/swag@latest
```

### 问题 2：`make web-prod` 无法连接后端

**症状：** API 请求返回 404 或连接被拒绝

**解决方案：**
1. 确认后端已启动：
   ```bash
   make server
   ```

2. 检查后端是否运行在 8080 端口：
   ```bash
   lsof -i :8080
   ```

3. 检查前端配置（vite.config.ts）中的 proxy 设置

### 问题 3：Mock 数据不生效

**症状：** 使用 `make web` 但仍然请求真实后端

**解决方案：**
1. 检查浏览器控制台，确认 MSW 已启用
2. 清除浏览器缓存
3. 检查 `frontend/src/main.tsx` 中的 MSW 初始化代码

---

## 📚 更多信息

- 详细项目说明：[README.md](README.md)
- 任务清单：[tasks.md](tasks.md)
- 后端配置：[backend/config.yaml](backend/config.yaml)

---

## 💡 提示

1. **开发时优先使用 Mock 模式**
   - 快速迭代前端 UI
   - 不依赖后端状态

2. **定期运行 `make gen`**
   - 保持前后端类型同步
   - 减少类型错误

3. **使用 `make help`**
   - 忘记命令时查看帮助
   - 了解所有可用功能

4. **分终端运行服务**
   - 前端一个终端
   - 后端一个终端
   - 便于查看日志
