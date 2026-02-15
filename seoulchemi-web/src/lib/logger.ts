/**
 * 서버 사이드 로깅 유틸리티
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
  userId?: number
  path?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

const MIN_LEVEL = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL]
}

function formatLog(entry: LogEntry): string {
  const { timestamp, level, message, data, userId, path, error } = entry
  const parts = [
    `[${timestamp}]`,
    `[${level.toUpperCase()}]`,
    userId ? `[user:${userId}]` : '',
    path ? `[${path}]` : '',
    message
  ].filter(Boolean)

  let output = parts.join(' ')
  
  if (data) {
    output += '\n  Data: ' + JSON.stringify(data, null, 2).replace(/\n/g, '\n  ')
  }
  
  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`
    if (error.stack) {
      output += '\n  Stack: ' + error.stack.split('\n').slice(0, 5).join('\n         ')
    }
  }

  return output
}

function createLogEntry(
  level: LogLevel,
  message: string,
  options?: {
    data?: unknown
    userId?: number
    path?: string
    error?: Error
  }
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: options?.data,
    userId: options?.userId,
    path: options?.path,
    error: options?.error ? {
      name: options.error.name,
      message: options.error.message,
      stack: options.error.stack
    } : undefined
  }
}

export const logger = {
  debug(message: string, options?: { data?: unknown; userId?: number; path?: string }) {
    if (!shouldLog('debug')) return
    const entry = createLogEntry('debug', message, options)
    console.log(formatLog(entry))
  },

  info(message: string, options?: { data?: unknown; userId?: number; path?: string }) {
    if (!shouldLog('info')) return
    const entry = createLogEntry('info', message, options)
    console.log(formatLog(entry))
  },

  warn(message: string, options?: { data?: unknown; userId?: number; path?: string }) {
    if (!shouldLog('warn')) return
    const entry = createLogEntry('warn', message, options)
    console.warn(formatLog(entry))
  },

  error(message: string, options?: { data?: unknown; userId?: number; path?: string; error?: Error }) {
    if (!shouldLog('error')) return
    const entry = createLogEntry('error', message, options)
    console.error(formatLog(entry))
    
    // 프로덕션에서는 에러 리포팅 서비스로 전송 가능
    // if (process.env.NODE_ENV === 'production') {
    //   sendToErrorReportingService(entry)
    // }
  },

  // API 요청 로깅
  apiRequest(method: string, path: string, options?: { userId?: number; body?: unknown }) {
    this.info(`API ${method} ${path}`, { userId: options?.userId, path, data: options?.body })
  },

  // API 응답 로깅
  apiResponse(method: string, path: string, status: number, options?: { userId?: number; duration?: number }) {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
    this[level](`API ${method} ${path} -> ${status}${options?.duration ? ` (${options.duration}ms)` : ''}`, {
      userId: options?.userId,
      path
    })
  },

  // 비즈니스 이벤트 로깅
  event(eventName: string, options?: { data?: unknown; userId?: number }) {
    this.info(`EVENT: ${eventName}`, options)
  }
}

export default logger
