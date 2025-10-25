/**
 * 应用常量配置
 */

// HackNotts 主题的告别消息
export const GOODBYE_MESSAGES = [
  '👋 Goodbye! Thanks for using HackNotts CLI! Keep hacking with playful cleverness!',
  '✨ See you at HackNotts 2025! Build something amazing!',
  '🌟 Farewell, hacker! May your code compile and your ideas flourish!',
  '💫 Until next time! Remember: every expert was once a beginner.',
  '🎉 Happy coding! See you at the University of Nottingham!',
  '🚀 Off you go! Time to turn those ideas into reality!',
  '🏆 Keep learning, keep building! HackNotts believes in you!',
  '💡 Goodbye! Don\'t forget: code is poetry, and you\'re the poet!'
] as const

// 命令前缀
export const COMMAND_PREFIX = '/'

// 退出命令的延迟时间(ms)
export const EXIT_DELAY = 800

// 消息角色显示配置
export const MESSAGE_ROLE_CONFIG = {
  user: {
    displayName: '👤 You',
    color: 'cyan' as const
  },
  assistant: {
    displayName: '🤖 AI',
    color: 'green' as const
  },
  system: {
    displayName: '⚙️  System',
    color: 'yellow' as const
  }
} as const
