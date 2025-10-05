# 定时任务系统使用说明

## 功能概述

TrackMyMoney 定时任务系统基于 Go 标准库实现，无第三方依赖，提供了完整的任务调度、通知推送和资产快照功能。

## 系统架构

### 核心组件

1. **调度器 (Scheduler)** - `internal/scheduler/`
   - 基于 `time.Ticker` 实现分钟级检查
   - 支持 cron 表达式（简化版）
   - 支持动态添加/删除任务

2. **任务系统 (Jobs)** - `internal/jobs/`
   - `DailySnapshotJob` - 每日资产快照任务
   - `NotificationDispatchJob` - 通知分发任务

3. **通知服务 (Notification Service)** - `internal/services/notification/`
   - `TelegramNotifier` - Telegram Bot API
   - `BarkNotifier` - Bark 推送服务
   - `EmailNotifier` - SMTP 邮件

## 配置说明

### 后端配置 (`backend/config.yaml`)

```yaml
scheduler:
  enabled: true               # 是否启用调度器
  check_interval: 60          # 检查间隔（秒）
  timezone: "Asia/Shanghai"   # 时区设置
```

### Cron 表达式格式

格式：`分钟 小时 日 月 星期`

示例：
- `0 6 * * *` - 每天早上 6:00
- `*/30 * * * *` - 每 30 分钟
- `0 */2 * * *` - 每 2 小时
- `0 9-17 * * 1-5` - 周一至周五 9:00-17:00 的每小时

支持语法：
- `*` - 任意值
- `*/N` - 每 N 个单位
- `N-M` - 范围
- `N,M,K` - 列表

## 内置任务

### 1. 每日资产快照 (daily_snapshot)

**执行时间**：每天早上 6:00
**功能**：
- 刷新所有股票资产的最新价格
- 刷新所有加密货币资产的最新价格
- 计算资产汇总（总资产、总负债、净资产、分类明细）
- 生成 `AssetHistory` 记录存入数据库

**实现位置**：`internal/jobs/snapshot.go`

### 2. 通知分发 (notification_dispatch)

**执行时间**：每 30 分钟检查一次
**功能**：
- 查询所有启用的通知配置
- 根据每个配置的 `schedule` 判断是否需要发送
- 获取最新资产汇总信息
- 调用相应的通知服务发送消息

**实现位置**：`internal/jobs/notification.go`

## API 接口

### 任务管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/jobs` | 创建定时任务 |
| GET | `/api/jobs` | 获取所有任务 |
| GET | `/api/jobs/:id` | 获取单个任务 |
| PUT | `/api/jobs/:id` | 更新任务 |
| DELETE | `/api/jobs/:id` | 删除任务 |
| POST | `/api/jobs/:id/trigger` | 手动触发任务 |
| GET | `/api/jobs/logs` | 获取执行日志 |

### 通知管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/notifications` | 创建通知配置 |
| GET | `/api/notifications` | 获取所有配置 |
| GET | `/api/notifications/:id` | 获取单个配置 |
| PUT | `/api/notifications/:id` | 更新配置 |
| DELETE | `/api/notifications/:id` | 删除配置 |
| POST | `/api/notifications/:id/test` | 测试通知 |

## 通知渠道配置

### Telegram

```json
{
  "bot_token": "YOUR_BOT_TOKEN",
  "chat_id": "YOUR_CHAT_ID"
}
```

获取方式：
1. 在 Telegram 中创建 Bot（联系 @BotFather）
2. 获取 bot_token
3. 将 Bot 添加到群组或私聊，发送消息
4. 访问 `https://api.telegram.org/bot<token>/getUpdates` 获取 chat_id

### Bark

```json
{
  "server_url": "https://api.day.app",
  "device_key": "YOUR_DEVICE_KEY",
  "sound": "birdsong",
  "group": "TrackMyMoney"
}
```

获取方式：
1. 在 App Store 下载 Bark
2. 打开应用获取设备密钥 (device_key)

### Email

```json
{
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "username": "your-email@gmail.com",
  "password": "your-app-password",
  "from": "your-email@gmail.com",
  "to": "recipient@example.com"
}
```

注意：
- Gmail 需要使用应用专用密码（App Password）
- QQ 邮箱使用授权码代替密码
- 可以使用逗号分隔多个收件人

## 使用示例

### 创建每日早报通知

```bash
curl -X POST http://localhost:8080/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "每日资产早报",
    "channel": "telegram_bot",
    "description": "每天早上7点推送资产汇总",
    "schedule": "0 7 * * *",
    "enabled": true,
    "config": "{\"bot_token\":\"YOUR_TOKEN\",\"chat_id\":\"YOUR_CHAT_ID\"}"
  }'
```

### 创建周报通知

```bash
curl -X POST http://localhost:8080/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "每周资产报告",
    "channel": "email",
    "description": "每周一早上9点发送邮件报告",
    "schedule": "0 9 * * 1",
    "enabled": true,
    "config": "{\"smtp_host\":\"smtp.gmail.com\",\"smtp_port\":587,\"username\":\"your@gmail.com\",\"password\":\"your-password\",\"from\":\"your@gmail.com\",\"to\":\"recipient@example.com\"}"
  }'
```

### 手动触发资产快照

```bash
curl -X POST http://localhost:8080/api/jobs/1/trigger
```

### 测试通知配置

```bash
curl -X POST http://localhost:8080/api/notifications/1/test
```

## 数据模型

### ScheduledJob

```go
type ScheduledJob struct {
    ID          uint       `json:"id"`
    Name        string     `json:"name"`
    Type        string     `json:"type"`        // "snapshot", "notification"
    Description string     `json:"description"`
    Schedule    string     `json:"schedule"`    // Cron 表达式
    Enabled     bool       `json:"enabled"`
    LastRunAt   *time.Time `json:"last_run_at"`
    NextRunAt   *time.Time `json:"next_run_at"`
    Config      string     `json:"config"`      // JSON 配置
}
```

### JobExecutionLog

```go
type JobExecutionLog struct {
    ID         uint       `json:"id"`
    JobName    string     `json:"job_name"`
    StartedAt  time.Time  `json:"started_at"`
    FinishedAt *time.Time `json:"finished_at"`
    Status     string     `json:"status"`      // "success", "failed", "running"
    ErrorMsg   string     `json:"error_msg"`
    Duration   int64      `json:"duration"`    // 毫秒
}
```

### Notification

```go
type Notification struct {
    ID          uint                `json:"id"`
    Name        string              `json:"name"`
    Channel     NotificationChannel `json:"channel"` // "telegram_bot", "bark", "email"
    Description string              `json:"description"`
    Config      string              `json:"config"`  // JSON 配置
    Schedule    string              `json:"schedule"`
    Enabled     bool                `json:"enabled"`
}
```

## 日志查看

任务执行日志存储在数据库中，可通过以下方式查看：

```bash
# 查看所有日志（最近50条）
curl http://localhost:8080/api/jobs/logs

# 查看指定任务的日志
curl "http://localhost:8080/api/jobs/logs?job_name=daily_snapshot&limit=20"
```

也可以查看应用日志文件：

```bash
tail -f backend/logs/app.log
```

## 故障排查

### 任务没有执行

1. 检查调度器是否启用：`config.yaml` 中 `scheduler.enabled` 是否为 `true`
2. 查看日志确认任务是否注册成功
3. 检查任务的 `enabled` 字段是否为 `true`
4. 检查 cron 表达式是否正确

### 通知发送失败

1. 使用测试接口验证通知配置：`POST /api/notifications/:id/test`
2. 检查配置 JSON 格式是否正确
3. 查看日志中的错误信息
4. 验证网络连接（防火墙、代理等）

### Telegram 通知失败

- 确认 bot_token 和 chat_id 正确
- Bot 必须先在群组或私聊中发送过消息
- 检查是否被 Telegram API 限流

### Email 发送失败

- 使用应用专用密码而非账户密码
- 检查 SMTP 端口（Gmail: 587, QQ: 465/587）
- 启用"允许不够安全的应用"（如适用）

## 技术特点

✅ **零依赖** - 仅使用 Go 标准库（time、net/http、net/smtp）
✅ **轻量级** - 自实现简化 cron 解析，无需第三方库
✅ **可扩展** - Job 接口设计，易于添加新任务类型
✅ **数据库驱动** - 任务配置存储在 SQLite，支持动态管理
✅ **优雅关闭** - 使用 context 和 channel 实现 graceful shutdown
✅ **日志完整** - 记录每次任务执行历史，便于排查问题
✅ **测试友好** - 支持手动触发任务，方便测试
