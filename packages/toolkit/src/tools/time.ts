/**
 * Built-in Time Tool
 * Provides timezone-aware time operations
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export interface TimeToolConfig {
  localTimezone?: string
}

/**
 * Time tool definition (MCP compatible)
 */
export const timeToolDefinition: Tool = {
  name: 'time',
  description:
    'Use this tool to get the current time or date. Call this whenever the user asks "what time is it", "current time", "now", "today\'s date", or requests time in a specific timezone. Also use to convert times between different timezones.',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['get_current_time', 'convert_time'],
        description: 'The time operation to perform'
      },
      timezone: {
        type: 'string',
        description:
          'IANA timezone name (e.g., "America/New_York", "Europe/London", "Asia/Tokyo")'
      },
      sourceTimezone: {
        type: 'string',
        description: 'Source IANA timezone for conversion'
      },
      targetTimezone: {
        type: 'string',
        description: 'Target IANA timezone for conversion'
      },
      time: {
        type: 'string',
        description: 'Time in 24-hour format HH:MM (for convert_time operation)'
      }
    },
    required: ['operation']
  }
}

/**
 * Get timezone offset in minutes
 */
function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset'
  })

  const parts = formatter.formatToParts(date)
  const offsetPart = parts.find((part) => part.type === 'timeZoneName')

  if (!offsetPart || !offsetPart.value) {
    return 0
  }

  const offset = offsetPart.value
  if (offset === 'GMT') return 0

  const match = offset.match(/GMT([+-])(\d{1,2}):?(\d{2})?/)
  if (!match) return 0

  const sign = match[1] === '+' ? 1 : -1
  const hours = parseInt(match[2], 10)
  const minutes = parseInt(match[3] || '0', 10)

  return sign * (hours * 60 + minutes)
}

/**
 * Check if a timezone is in DST
 */
function isDST(timezone: string, date: Date = new Date()): boolean {
  const jan = new Date(date.getFullYear(), 0, 1)
  const jul = new Date(date.getFullYear(), 6, 1)

  const janOffset = getTimezoneOffset(timezone, jan)
  const julOffset = getTimezoneOffset(timezone, jul)
  const currentOffset = getTimezoneOffset(timezone, date)

  // If the current offset is different from standard time offset, we're in DST
  return currentOffset !== Math.max(janOffset, julOffset)
}

/**
 * Format date in ISO 8601
 */
function formatISO(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  const parts = formatter.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value || ''

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
}

/**
 * Get timezone abbreviation
 */
function getTimezoneAbbr(timezone: string, date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  })

  const parts = formatter.formatToParts(date)
  const abbr = parts.find((part) => part.type === 'timeZoneName')?.value

  return abbr || timezone
}

/**
 * Time tool implementation
 */
export async function executeTimeTool(
  args: {
    operation: string
    timezone?: string
    sourceTimezone?: string
    targetTimezone?: string
    time?: string
  },
  config: TimeToolConfig = {}
): Promise<any> {
  const { operation } = args

  try {
    switch (operation) {
      case 'get_current_time': {
        const timezone =
          args.timezone ||
          config.localTimezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone
        const now = new Date()

        // Validate timezone
        try {
          Intl.DateTimeFormat('en-US', { timeZone: timezone })
        } catch (error) {
          throw new Error(`Invalid timezone: ${timezone}`)
        }

        const isoTime = formatISO(now, timezone)
        const offset = getTimezoneOffset(timezone, now)
        const offsetHours = Math.floor(Math.abs(offset) / 60)
        const offsetMinutes = Math.abs(offset) % 60
        const offsetSign = offset >= 0 ? '+' : '-'
        const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`

        return {
          success: true,
          operation: 'get_current_time',
          timezone,
          datetime: isoTime,
          offset: offsetStr,
          isDST: isDST(timezone, now),
          abbreviation: getTimezoneAbbr(timezone, now),
          timestamp: now.getTime()
        }
      }

      case 'convert_time': {
        if (!args.sourceTimezone) {
          throw new Error('sourceTimezone is required for convert_time')
        }
        if (!args.targetTimezone) {
          throw new Error('targetTimezone is required for convert_time')
        }
        if (!args.time) {
          throw new Error('time is required for convert_time (format: HH:MM)')
        }

        // Validate timezones
        try {
          Intl.DateTimeFormat('en-US', { timeZone: args.sourceTimezone })
          Intl.DateTimeFormat('en-US', { timeZone: args.targetTimezone })
        } catch (error) {
          throw new Error('Invalid timezone provided')
        }

        // Parse time
        const timeMatch = args.time.match(/^(\d{1,2}):(\d{2})$/)
        if (!timeMatch) {
          throw new Error('Invalid time format. Use HH:MM (24-hour format)')
        }

        const hours = parseInt(timeMatch[1], 10)
        const minutes = parseInt(timeMatch[2], 10)

        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          throw new Error('Invalid time values. Hours: 0-23, Minutes: 0-59')
        }

        // Create date object in source timezone
        const now = new Date()
        const sourceDate = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            hours,
            minutes,
            0
          )
        )

        // Adjust for source timezone offset
        const sourceOffset = getTimezoneOffset(args.sourceTimezone, sourceDate)
        const adjustedDate = new Date(sourceDate.getTime() - sourceOffset * 60 * 1000)

        const sourceISO = formatISO(adjustedDate, args.sourceTimezone)
        const targetISO = formatISO(adjustedDate, args.targetTimezone)

        const timeDiff = getTimezoneOffset(args.targetTimezone) - sourceOffset

        return {
          success: true,
          operation: 'convert_time',
          source: {
            timezone: args.sourceTimezone,
            datetime: sourceISO,
            isDST: isDST(args.sourceTimezone, adjustedDate),
            abbreviation: getTimezoneAbbr(args.sourceTimezone, adjustedDate)
          },
          target: {
            timezone: args.targetTimezone,
            datetime: targetISO,
            isDST: isDST(args.targetTimezone, adjustedDate),
            abbreviation: getTimezoneAbbr(args.targetTimezone, adjustedDate)
          },
          timeDifference: {
            minutes: timeDiff,
            hours: timeDiff / 60,
            formatted: `${timeDiff >= 0 ? '+' : ''}${timeDiff / 60} hours`
          }
        }
      }

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      operation,
      error: errorMessage
    }
  }
}
