import process from 'node:process'
import nodemailer from 'nodemailer'
import { logger } from '../utils/logger.js'

// SMTP 配置（从 GitHub Secrets 读取）
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.163.com',
  port: Number.parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || ''
  }
}

// Resend 配置（从环境变量读取）
const resendConfig = {
  apiKey: process.env.RESEND_API_KEY || ''
}

  // 创建 SMTP transporter
  const smtpTransporter = nodemailer.createTransport(smtpConfig)

  // 创建 Resend transporter（备用，从环境变量读取）
  const resendConfig = {
    apiKey: process.env.RESEND_API_KEY || ''
  }
  const resendTransporter = !useSmtp ? nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: resendConfig.apiKey
    }
  }) : null

  // 选择 transporter
  const transporter = smtpTransporter

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
