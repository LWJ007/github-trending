import process from 'node:process'
import nodemailer from 'nodemailer'
import { logger } from '../utils/logger.js'

// SMTP 配置（从环境变量读取）
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.163.com',
  port: Number.parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE !== 'false', // 默认 true
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
}

// Resend 配置（从环境变量读取）
const resendConfig = {
  apiKey: process.env.RESEND_API_KEY || '',
}

// 创建 SMTP transporter
function createSmtpTransporter() {
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    logger.warn('SMTP 配置不完整，将使用 Resend API')
    return null
  }
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: smtpConfig.auth,
  })
}

// 配置
const fromEmail = process.env.RESEND_FROM_EMAIL || ''
const toEmail = process.env.RESEND_TO_EMAIL || ''
const isDevelopment = process.env.NODE_ENV === 'development'
const emailSendEnabled = process.env.EMAIL_SEND_ENABLED !== 'false'
const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 秒后重试

// 判断是否使用 SMTP
function useSmtpTransporter() {
  return process.env.USE_SMTP === 'true' && smtpConfig.auth.user && smtpConfig.auth.pass
}

// 判断是否使用 Resend
function useResendTransporter() {
  return !useSmtpTransporter() && resendConfig.apiKey && fromEmail && toEmail
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 使用 Resend 发送邮件
async function sendViaResend(html: string): Promise<{ messageId: string, response: string }> {
  if (!resendConfig.apiKey) {
    throw new Error('Resend API key not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendConfig.apiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `GitHub Trending Daily - ${new Date().toLocaleDateString('zh-CN')}`,
      html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return {
    messageId: data.id,
    response: JSON.stringify(data),
  }
}

// 使用 SMTP 发送邮件
async function sendViaSmtp(transporter: ReturnType<typeof nodemailer.createTransport>, html: string): Promise<{ messageId: string, response: string }> {
  const result = await transporter.sendMail({
    from: smtpConfig.auth.user,
    to: [toEmail],
    subject: `GitHub Trending Daily - ${new Date().toLocaleDateString('zh-CN')}`,
    html,
  })

  return {
    messageId: result.messageId || '',
    response: result.response?.toString() || '',
  }
}

// 带重试的邮件发送函数
async function sendEmailWithRetry(html: string, retryCount = 0): Promise<void> {
  const useSmtp = useSmtpTransporter()

  // 选择 transporter
  const smtpTransporter = createSmtpTransporter()
  const transporter = smtpTransporter

  if (!transporter && !useSmtpTransporter()) {
    throw new Error('No valid email transporter configured')
  }

  try {
    let result: { messageId: string, response: string }

    if (useSmtp) {
      if (!transporter) {
        throw new Error('SMTP transporter not configured')
      }
      result = await sendViaSmtp(transporter, html)
    }
    else {
      result = await sendViaResend(html)
    }

    logger.info('邮件发送成功', {
      emailId: result.messageId,
      service: useSmtp ? 'SMTP' : 'Resend',
      response: result.response,
    })
  }
  catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (retryCount < MAX_RETRIES) {
      logger.warn(`邮件发送失败，${RETRY_DELAY}ms 后重试 (${retryCount + 1}/${MAX_RETRIES})`, {
        error: errorMessage,
        service: useSmtp ? 'SMTP' : 'Resend',
      })
      await sleep(RETRY_DELAY)
      await sendEmailWithRetry(html, retryCount + 1)
    }
    else {
      logger.error('邮件发送失败，已达到最大重试次数', {
        error,
        service: useSmtp ? 'SMTP' : 'Resend',
      })
      throw new Error(`Failed to send email after ${MAX_RETRIES} attempts`)
    }
  }
}

export async function sendEmail(html: string, language?: string): Promise<void> {
  try {
    if (isDevelopment || !emailSendEnabled) {
      logger.info('开发模式或已关闭邮件发送，改为输出邮件内容到控制台')
      logger.info('邮件内容预览：', { length: html.length })
      logger.info('─────────────────────────────────────')
      logger.info(html)
      logger.info('─────────────────────────────────────')
      return
    }

    await sendEmailWithRetry(html)
  }
  catch (error: unknown) {
    logger.error('发送邮件时出错', error)
    throw error
  }
}
