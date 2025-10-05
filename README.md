# TrackMyMoney - 资金收益追踪系统

一个基于 React + Golang 的全栈资金收益追踪系统。

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18.0
- **Go** >= 1.25
- **npm** 或 **yarn**

### 使用 Makefile 命令

本项目提供了完整的 Makefile 支持，简化开发流程。

#### 查看所有可用命令

```bash
make help
```

#### 🎯 常用命令

##### 1. 启动前端（Mock 模式）

```bash
make web
```

- 启动前端开发服务器（http://localhost:3000）
- **使用 MSW Mock**，不需要后端运行
- 适合纯前端开发和调试

##### 2. 启动前端（连接真实后端）

```bash
make web-prod
```

- 启动前端开发服务器（http://localhost:3000）
- **连接真实后端** API（http://localhost:8080）
- 需要先启动后端服务器

##### 3. 启动后端服务器

```bash
make server
```

- 启动后端服务器（http://localhost:8080）
- 使用 SQLite 数据库
- 支持热重载（通过 air，需另行配置）

##### 4. 生成 OpenAPI 文档和前端类型

```bash
make gen
```

这个命令会：
1. 根据后端 Swagger 注释生成 OpenAPI 文档（`backend/docs/swagger.json`）
2. 根据 OpenAPI 文档生成前端 TypeScript 类型定义（`frontend/src/types/generated/`）

分步执行：
```bash
make gen-openapi    # 只生成 OpenAPI 文档
make gen-types      # 只生成前端类型（依赖 OpenAPI 文档）
```

## 📁 项目结构

```
TrackMyMoney/
├── backend/                  # 后端项目（Golang）
│   ├── cmd/api/             # 入口文件
│   ├── internal/            # 内部代码
│   │   ├── config/          # 配置管理
│   │   ├── database/        # 数据库
│   │   ├── handlers/        # API 处理器
│   │   └── models/          # 数据模型
│   ├── pkg/                 # 公共包
│   ├── docs/                # 生成的 OpenAPI 文档
│   └── config.yaml          # 配置文件
├── frontend/                # 前端项目（React + TypeScript）
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── pages/           # 页面
│   │   ├── services/        # API 服务
│   │   ├── stores/          # 状态管理（Zustand）
│   │   ├── mocks/           # MSW Mock
│   │   └── types/           # 类型定义
│   └── package.json
├── Makefile                 # 开发命令
└── README.md
```

## 🛠️ 开发工作流

### 场景 1：纯前端开发（使用 Mock）

```bash
# 启动前端（Mock 模式）
make web
```

访问 http://localhost:3000，所有 API 请求将被 MSW 拦截并返回 Mock 数据。

### 场景 2：前后端联调

**Terminal 1 - 启动后端：**
```bash
make server
```

**Terminal 2 - 启动前端（连接真实后端）：**
```bash
make web-prod
```

访问 http://localhost:3000，API 请求将发送到 http://localhost:8080。

### 场景 3：修改 API 后重新生成类型

```bash
# 1. 修改后端 handler 中的 Swagger 注释
# 2. 重新生成文档和类型
make gen

# 3. 查看生成的类型
cat frontend/src/types/generated/Api.ts
```

## 🔧 其他有用的命令

### 安装依赖

```bash
# 安装所有工具和依赖
make install-tools

# 或分别安装
make install-frontend    # 仅安装前端依赖
make install-backend     # 仅安装后端依赖
```

### 构建项目

```bash
make build              # 构建前后端
make build-frontend     # 仅构建前端
make build-backend      # 仅构建后端
```

### 代码检查

```bash
make lint-frontend      # 前端 ESLint 检查
```

### 清理文件

```bash
make clean              # 清理生成的文件
make clean-all          # 清理所有文件（包括 node_modules）
```

## 📝 默认登录凭证

- **用户名**: `admin`
- **密码**: `admin123`

## 🎨 技术栈

### 后端
- **Golang** 1.25
- **Gin** - Web 框架
- **GORM** - ORM
- **SQLite** - 数据库
- **Zap** - 日志库
- **JWT** - 认证
- **Swag** - OpenAPI 文档生成

### 前端
- **React** 19
- **TypeScript** 5.9
- **Ant Design** 5.27.4
- **Ant Design Pro Components**
- **Zustand** - 状态管理
- **MSW** - API Mock
- **Vite** - 构建工具
- **React Router** - 路由
- **@ant-design/charts** - 图表

## 📊 功能特性

- ✅ JWT 认证登录
- ✅ 账目管理（支持 5 种账目类型：现金、生息账户、股票、债务、加密货币）
- ✅ 数据源管理（Yahoo Finance）
- ✅ 推送管理（Bark、Telegram Bot、Email）
- ✅ 资产统计（总资产、总负债、净资产）
- ✅ 历史数据可视化（折线图、饼图）
- ✅ MSW Mock 支持（前端独立开发）
- ✅ OpenAPI 文档自动生成
- ✅ TypeScript 类型自动生成

## 🔍 API 文档

启动后端后，访问：
- Swagger UI: http://localhost:8080/swagger/index.html （需要集成 Swagger UI）
- OpenAPI JSON: `backend/docs/swagger.json`
- OpenAPI YAML: `backend/docs/swagger.yaml`

## 📄 License

MIT License
