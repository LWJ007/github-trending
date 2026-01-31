import type { ClaudeMessage, TrendingAnalysisResult } from '../../types/index.js'
import { logger } from './logger.js'

export function extractJSON(messages: ClaudeMessage[]): TrendingAnalysisResult {
  logger.info(`extractJSON: 收到 ${messages.length} 条消息`)
  logger.info(`extractJSON: messages 类型`, typeof messages)

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    if (!message)
      continue

    logger.info(`extractJSON: 消息 ${i} type=${message.type}, hasContent=${!!message.content}, hasResult=${!!message.result}`)

    if (message.type === 'assistant') {
      const content = message.content
      if (Array.isArray(content)) {
        logger.info(`extractJSON: 消息 ${i} 是 assistant 类型，有 ${content.length} 个 content item`)
        for (let j = 0; j < content.length; j++) {
          const item = content[j]
          if (!item)
            continue
          logger.info(`extractJSON:   item ${j} type=${item.type}, hasText=${!!item.text}, textLength=${item.text ? item.text.length : 0}`)
          if (item.type === 'text' && item.text) {
            const parsed = tryExtractJSON(item.text)
            if (parsed) {
              logger.info(`extractJSON: 从消息 ${i} 的第 ${j} 个 content item 中提取到 JSON`)
              return parsed
            }
          }
        }
      }
      else {
        logger.warn(`extractJSON: 消息 ${i} 是 assistant 类型，但 content 不是数组，content=`, content)
      }
    }
    else if (message.type === 'result' && message.result) {
      logger.info(`extractJSON: 消息 ${i} 是 result 类型，尝试解析 result 字段`)
      logger.info(`extractJSON: result 字段内容（前 1000 字符）:`, message.result.substring(0, 1000))
      const parsed = tryExtractJSON(message.result)
      if (parsed) {
        logger.info(`extractJSON: 从消息 ${i} 的 result 字段中提取到 JSON`)
        return parsed
      }
      else {
        logger.warn(`extractJSON: 消息 ${i} 的 result 字段无法解析为 JSON，result=`, message.result.substring(0, 500))
      }
    }
  }

  const errorMsg = '无法从 Claude 响应中提取有效的 JSON 数据'
  logger.error(errorMsg)
  logger.info('所有消息详情:', JSON.stringify(messages, null, 2))
  throw new Error(errorMsg)
}

function tryExtractJSON(text: string): TrendingAnalysisResult | null {
  let cleanText = text.trim()

  // 检测是否是错误消息
  if (cleanText.includes('API Error') || cleanText.includes('403') || cleanText.includes('forbidden')) {
    logger.error('检测到 API 错误消息:', cleanText.substring(0, 200))
    throw new Error('API 调用失败，请检查 ANTHROPIC_API_KEY 配置')
  }

  const codeBlockMatch = cleanText.match(/```(?:json)?\n([\s\S]*?)\n```/)
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleanText = codeBlockMatch[1].trim()
  }

  try {
    const parsed = JSON.parse(cleanText)

    // 验证解析结果是否符合 TrendingAnalysisResult 类型
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    // 检查必需的字段
    if (!parsed.date || !Array.isArray(parsed.projects)) {
      logger.warn('解析的 JSON 缺少必需字段（date 或 projects）')
      return null
    }

    return parsed as TrendingAnalysisResult
  }
  catch {
    const jsonBracketsMatch = cleanText.match(/\{[\s\S]*\}/)
    if (jsonBracketsMatch) {
      try {
        const parsed = JSON.parse(jsonBracketsMatch[0])

        // 验证解析结果
        if (!parsed || typeof parsed !== 'object' || !parsed.date || !Array.isArray(parsed.projects)) {
          return null
        }

        return parsed as TrendingAnalysisResult
      }
      catch {
        return null
      }
    }
    return null
  }
}
