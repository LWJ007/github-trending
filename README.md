# GitHub Trending 每日推送

一个自动化脚本，在 GitHub Actions 上定时运行，通过自定义 MCP Server 获取 GitHub Trending 页面的热门项目列表，然后让 Claude AI 通过 Web Search 工具自主地获取每个项目的详细信息、进行分析，并生成邮件通过 Resend/SMTP 发送到指定邮箱。

## ✨ 特性

- 🚀 **自动化执行**：通过 GitHub Actions 定时每天 09:00 UTC 自动运行
- 🤖 **Claude AI 分析**：使用 Claude AI 进行深度的智能分析
- 🌐 **Web Search**：Claude 自主使用 Web Search 获取项目详细信息
- 📧 **邮件推送**：支持 Resend API 或 SMTP（163、QQ 等传统邮箱）
- 🌍 **多语言支持**：支持按语言分类抓取，每语言单独发送邮件
- 🎨 **响应式设计**：邮件模板基于 Tailwind CSS，支持移动端
- 🔧 **自定义模型**：支持使用非 Anthropic 官方的模型（OpenAI、DeepSeek 等）
- 📊 **多维度分析**：包括项目简介、技术栈、核心功能、trending 原因和推荐指数

## 📋 环境要求

- Node.js 18+
- Claude API Key（或兼容的 OpenAI API Key）
- Resend API Key **或 SMTP 邮箱配置**

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置以下变量：

```env
# Claude API（必填）
ANTHROPIC_API_KEY=sk-ant-xxx

# 自定义模型配置（可选）
ANTHROPIC_BASE_URL=https://api.openai.com/v1
ANTHROPIC_MODEL=gpt-4o
```

#### 邮件服务配置（二选一）

**方式 1：使用 Resend API（推荐）**
```env
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_TO_EMAIL=recipient@example.com
```

**方式 2：使用 SMTP（如 163、QQ 邮箱）**
```env
USE_SMTP=true
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@163.com
SMTP_PASSWORD=your-smtp-password
```

### 3. 本地运行

```bash
npm start
```

或使用热重载模式：

```bash
npm run dev
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置以下变量：

```env
# Claude API（必填）
ANTHROPIC_API_KEY=sk-ant-xxx

# 自定义模型配置（可选）
ANTHROPIC_BASE_URL=https://api.openai.com/v1
ANTHROPIC_MODEL=gpt-4o

#### 邮件服务配置（二选一）

**方式 1：使用 Resend API（推荐）**

在 GitHub Secrets 中配置：
- `RESEND_API_KEY`：Resend API 密钥（[获取](https://resend.com/api-keys)）
- `RESEND_FROM_EMAIL`：发件人邮箱（需在 Resend 中验证过域名）
- `RESEND_TO_EMAIL`：收件人邮箱

**方式 2：使用 SMTP（如 163、QQ 邮箱）**

在 GitHub Secrets 中配置：
- `USE_SMTP`：设置为 `true` 启用 SMTP
- `SMTP_HOST`：SMTP 服务器（如 `smtp.163.com`）
- `SMTP_PORT`：SMTP 端口（如 `465`）
- `SMTP_SECURE`：是否使用 SSL/TLS（`true`）
- `SMTP_USER`：SMTP 用户名（邮箱地址）
- `SMTP_PASSWORD`：SMTP 授权码（⚠️ 不是邮箱登录密码）

**重要提示：**
- ⚠️ **不要在 `.env` 文件中直接写入 `SMTP_USER` 和 `SMTP_PASSWORD`**
- ⚠️ 这些敏感信息应该从 GitHub Secrets 读取
- 163 邮箱授权码获取：邮箱设置 → POP3/SMTP/IMAP → 开启 SMTP 服务 → 生成授权码

# GitHub Trending 语言配置（可选）
# 配置要抓取的语言列表，用逗号分隔
# 示例：typescript,python,go,rust,javascript
#
# 行为说明：
# - 留空：只抓取一次所有语言（https://github.com/trending），发送 1 封邮件
# - 配置语言：先抓取一次所有语言，然后再抓取每个配置的语言
#   例如：TRENDING_LANGUAGES=typescript,python
#   会发送 3 封邮件：[所有语言], [TypeScript], [Python]
TRENDING_LANGUAGES=typescript,python,go

# 邮件发送控制（可选）
EMAIL_SEND_ENABLED=true  # 设为 false 则不发送邮件，改为输出内容
NODE_ENV=development     # 开发模式下自动不发送邮件

# 日志配置
LOG_LEVEL=info
# 打印大模型输出（可选）
LOG_LLM_OUTPUT=false
# 流式打印大模型输出（可选）
LOG_LLM_STREAM=false
```

### 3. 本地运行

```bash
npm start
```

或使用热重载模式：

```bash
npm run dev
```

### 4. 部署到 GitHub Actions

1. 将代码推送到 GitHub 仓库
2. 在 GitHub 仓库的 Settings → Secrets and variables → Actions 中配置以下 Secrets：
   - `ANTHROPIC_API_KEY`：Claude API 密钥（必填）
   - `ANTHROPIC_BASE_URL`：自定义 API 端点（可选）
   - `ANTHROPIC_MODEL`：自定义模型名称（可选）
   - `RESEND_API_KEY`：Resend API 密钥（必填）
   - `RESEND_FROM_EMAIL`：发件人邮箱（必填）
   - `RESEND_TO_EMAIL`：收件人邮箱（必填）
   - `TRENDING_LANGUAGES`：要抓取的语言列表，用逗号分隔（可选）
     - 留空：只抓取一次所有语言，发送 1 封邮件
     - 配置：先抓取所有语言，再抓取每个配置的语言
     - 示例：`typescript,python,go` 会发送 4 封邮件（所有语言 + 3 个语言）
   - `EMAIL_SEND_ENABLED`：是否发送邮件（可选，默认 true）
   - `NODE_ENV`：开发模式下自动不发送邮件（可选，设置为 development）

3. 开启 GitHub Actions 工作流（已配置每天 09:00 UTC 自动运行）

## 📁 项目结构

```
github-trending-daily/
├── src/
│   ├── index.ts                      # 主入口
│   ├── mcp/
│   │   └── trendingMcpServer.ts      # Trending MCP Server
│   ├── claude/
│   │   └── agent.ts                  # Claude Agent Prompt
│   ├── email/
│   │   ├── emailGenerator.ts         # 邮件生成器
│   │   └── emailSender.ts            # 邮件发送器
│   └── utils/
│       ├── jsonExtractor.ts          # JSON 提取器
│       └── logger.ts                 # 日志工具
├── types/
│   └── index.ts                      # TypeScript 类型定义
├── .github/
│   └── workflows/
│       └── daily-trending.yml        # GitHub Actions 工作流
└── .env.example                      # 环境变量示例
```

## 🔧 技术栈

- **运行时**：Node.js
- **语言**：TypeScript
- **Claude SDK**：@anthropic-ai/claude-agent-sdk
- **HTML 解析**：cheerio
- **邮件服务**：Resend
- **CI/CD**：GitHub Actions

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

感谢 Claude AI、Anthropic、Resend 和开源社区的支持。
