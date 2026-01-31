# AGENTS.md - GitHub Trending Daily 代码库规范

本文档为在此代码库中工作的 AI 编程助手提供指南。

---

## 项目信息

- **名称**: github-trending-daily
- **运行时**: Node.js
- **语言**: TypeScript
- **模块系统**: ES Modules (`"type": "module"`)
- **测试框架**: 未配置

---

## 运行和测试命令

### 运行应用
```bash
# 开发模式（热重载）
npm run dev
# 或
node --watch src/index.ts

# 生产模式
npm start
# 或
node src/index.ts
```

### 代码检查
```bash
# 运行 ESLint
npm run lint
# 或
eslint .

# 自动修复问题
npm run lint:fix
# 或
eslint . --fix
```

### 运行测试
```bash
# 运行所有测试
npm test

# 运行单个测试文件
npm test path/to/test.test.ts
```

### 依赖管理
```bash
# 安装依赖
npm install
```

---

## 代码风格指南

### 导入顺序
1. 第三方库导入（外部依赖）
2. 内部模块导入（项目内部，使用相对路径 `./`, `../`）
3. `import type` 可以在类型导入中使用

**示例**:
```typescript

### 命名约定
- **变量/函数**: camelCase (驼峰命名)
- **类型/接口**: PascalCase
- **常量**: camelCase 或 UPPER_SNAKE_CASE
- **类**: PascalCase

**示例**:
```typescript
const maxRepos = 10
const apiKey = { getAgentPrompt }
interface TrendingRepository { }
class EmailGenerator { }
const LOG_LEVEL = 'info'
```

### 缩进和格式
- **缩进**: 2 空格
- **引号**: 双引号（字符串）vs 单引号（导入）
- **分号**: 必须使用（ESLint 强制要求）

### 类型使用
- **严格类型**: 使用 TypeScript 严格模式（`"strict": true`）
- **禁止使用 `any`**: 优先使用 `unknown` 或明确类型
- **类型导入**: 使用 `import type { }` 语法

### 错误处理
- **异常抛出**: 使用 `throw new Error()` 描述清楚错误原因
- **日志记录**: 使用 `logger.error()` 记录错误详情
- **环境变量检查**: 必要时验证必需的环境变量

**示例**:
```typescript
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable')
}

try {
  await sendEmail(html)
}
catch (error) {
  logger.error('邮件发送失败:', error)
  throw error
}
```

### 函数定义
- **箭头函数**: 优先使用箭头函数（特别是导出函数）
- **命名函数**: 需要递归或复杂逻辑时使用具名函数

---

## Node.js/npm 规范

### 必须使用 npm 命令
- 使用 `npm install` 安装依赖
- 使用 `npm run` 运行脚本
- 使用 `npm test` 运行测试
- 使用 `node --watch` 开发模式热重载

### Node.js API
- 使用 `fs/promises` 进行文件操作
- 使用 `child_process` 或 `execa` 执行命令
- 使用 `express` 创建 HTTP 服务器
- 使用 `sqlite3` 或 `better-sqlite3` 进行数据库操作
- 使用 `ioredis` 进行 Redis 操作
- 使用 `pg` 进行 PostgreSQL 操作

### 环境变量
- 使用 `dotenv` 包加载 `.env`
- 使用 `process.env` 访问环境变量

---

## 项目结构约定

```
src/
├── index.ts                      # 主入口
├── mcp/
│   └── trendingMcpServer.ts      # MCP Server
├── claude/
│   └── agent.ts                  # Claude Agent Prompt
├── email/
│   ├── emailGenerator.ts         # 邮件生成器
│   └── emailSender.ts            # 邮件发送器
└── utils/
    ├── jsonExtractor.ts          # JSON 提取器
    └── logger.ts                 # 日志工具

types/
└── index.ts                      # 类型定义
```

### 模块导出
- 使用具名导出 `export function funcName() { }`
- 导入时使用 `import { funcName } from './module.js'`
- 注意：ES Module 需要显式 `.js` 扩展名

---

## 日志规范

### 使用 logger 工具
项目使用自定义 logger（位于 `src/utils/logger.ts`），而非 `console.log`。

```typescript
import { logger } from './utils/logger.js'

logger.debug('调试信息')
logger.info('一般信息')
logger.warn('警告信息')
logger.error('错误信息', errorObject)
```

### 日志级别配置
通过 `LOG_LEVEL` 环境变量控制：
- `debug`: 详细调试信息
- `info`: 一般信息（默认）
- `warn`: 警告信息
- `error`: 错误信息

### Console 使用
- 生产代码中使用 `logger`，而非 `console`
- 允许临时使用 `console.log` 进行调试（ESLint 设置为 `warn`）
- 流式输出使用 `process.stdout.write`（如 LLM 流式输出）

---

## 类型定义规范

### 类型文件位置
所有共享类型定义在 `types/index.ts` 中。

### 类型导入
```typescript
``

---

## ESLint 规则

项目使用 `@antfu/eslint-config`，特殊规则：
- `no-console`: `warn`（允许使用 console，但会警告）
- `no-unused-vars`: `warn`（未使用变量仅警告）
- `@typescript-eslint/no-unused-vars`: `warn`
- `unused-imports/no-unused-vars`: `warn`
- `unused-imports/no-unused-imports`: `warn`

---

## 重要注意事项

### 必须记住
1. **使用 Node.js 运行时**
2. **ES Module**：所有导入必须包含 `.js` 扩展名
3. **严格类型**：TypeScript 严格模式已启用
4. **使用 dotenv**：需要手动加载 `.env`
5. **日志使用 logger**：而非 console（除非特殊需求）

### 代码质量
- **无类型错误**：不允许使用 `as any` 或 `@ts-ignore`
- **无空 catch**：异常必须被处理或记录
- **测试覆盖**：添加新功能时需添加测试

### 环境变量
必须的环境变量：
- `ANTHROPIC_API_KEY`: Claude API 密钥
- `RESEND_API_KEY`: Resend API 密钥
- `RESEND_FROM_EMAIL`: 发件人邮箱
- `RESEND_TO_EMAIL`: 收件人邮箱

可选的环境变量：
- `ANTHROPIC_BASE_URL`: 自定义 API 端点
- `ANTHROPIC_MODEL`: 自定义模型名称
- `TRENDING_LANGUAGES`: 抓取的语言列表（逗号分隔）
- `LOG_LEVEL`: 日志级别
- `LOG_LLM_OUTPUT`: 打印 LLM 输出
- `LOG_LLM_STREAM`: 流式打印 LLM 输出
- `MAX_TRENDING_REPOS`: 最多分析的项目数量（降级模式）
- `EMAIL_SEND_ENABLED`: 是否发送邮件
- `NODE_ENV`: 环境模式（development 下不发送邮件）

---

## Cursor 规则集成

项目已配置 Cursor IDE 规则（位于 `.cursor/rules/`），使用 Node.js/npm。

### 关键规则
- 使用 `node <file>` 或 `npm run <script>`
- 使用 `npm test` 运行测试
- 使用 `npm install` 安装依赖
- 使用 `npm run <script>` 运行脚本
- 使用 `npx <package> <command>` 执行包

---

## 开发工作流

### 开始开发
```bash
npm install
npm run dev
```

### 检查代码
```bash
npm run lint:fix
```

### 运行测试
```bash
npm test
```

### 提交前检查
1. 运行 `npm run lint` 确保无错误
2. 运行测试（如果已配置）
3. 确保无 TypeScript 类型错误

---

## 语言和沟通风格

- **注释语言**: 中文
- **直接回答**: 不使用客套话
- **高效沟通**: 简洁明了

---

## 常见问题

**Q: 为什么导入需要 .js 扩展名？**
A: 项目使用 ES Module (`"type": "module"`)，需要显式扩展名。

**Q: 如何加载 .env？**
A: 使用 `dotenv` 包自动加载。

**Q: 如何运行热重载模式？**
A: 使用 `node --watch src/index.ts` 或 `npm run dev`。

**Q: ESLint 报告 console 警告？**
A: 生产代码使用 `logger`，临时调试可用 console。
