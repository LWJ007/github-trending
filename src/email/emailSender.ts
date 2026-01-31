import process from 'node:process'
import nodemailer from 'nodemailer'
import { logger } from '../utils/logger.js'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000
const emailSendEnabled = !['false', '0', 'no'].includes((process.env.EMAIL_SEND_ENABLED || '').toLowerCase())
const isDevelopment = process.env.NODE_ENV === 'development'
const useSmtp = process.env.USE_SMTP === 'true' || false

// SMTP 配置
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.163.com',
  port: Number.parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || ''
  }
}

// Resend 配置（保留作为备用）
const resendConfig = {
  apiKey: process.env.RESEND_API_KEY || ''
}

// 创建 SMTP transporter
const smtpTransporter = useSmtp ? nodemailer.createTransport(smtpConfig) : null

// 创建 Resend transporter（备用）
const resendTransporter = !useSmtp ? nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: resendConfig.apiKey
  }
}) : null

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendEmailWithRetry(
  html: string,
  language: string | undefined,
  retryCount: number = 0,
): Promise<void> {
  const fromEmail = useSmtp
    ? process.env.SMTP_USER
    : process.env.RESEND_FROM_EMAIL
  const toEmail = process.env.RESEND_TO_EMAIL
  const date = new Date().toISOString().split('T')[0]

  if (!fromEmail || !toEmail) {
    throw new Error('Missing required email environment variables: SMTP_USER/SMTP_PASSWORD (for SMTP) or RESEND_FROM_EMAIL (for Resend)')
  }

  const languageLabel = language ? ` [${language}]` : ''
  const subject = `GitHub Trending 每日推送${languageLabel} - ${date}`

  // 选择 transporter
  const transporter = useSmtp ? smtpTransporter : resendTransporter

  if (!transporter) {
    throw new Error('No valid email transporter configured')
  }

  try {
    const { messageId, response } = await transporter.sendMail({
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
    })

    logger.info('邮件发送成功', {
      emailId: messageId,
      service: useSmtp ? 'SMTP' : 'Resend',
      response: response?.toString()
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
      await sendEmailWithRetry(html, language, retryCount + 1)
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

    await sendEmailWithRetry(html, language)
  }
  catch (error: unknown) {
    logger.error('发送邮件时出错', error)
    throw error
  }
}
