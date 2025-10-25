// HackNotts 2025 - CLI Interface ASCII Art Collection
// Celebrating playful cleverness and the hacker spirit!

export const standardAsciiLogo = `
  _   _            _    _   _       _   _       _   ____  ____
 | | | | __ _  ___| | _| \ | | ___ | |_| |_ ___( ) |___ \| ___|
 | |_| |/ _\` |/ __| |/ /  \| |/ _ \| __| __/ __|/    __) |___ \
 |  _  | (_| | (__|   <| |\  | (_) | |_| |_\__ \    / __/ ___) |
 |_| |_|\__,_|\___|_|\_\_| \_|\___/ \__|\__|___/   |_____|____/
`;

export const blocksAsciiLogo = `
 .----------------.  .----------------.  .----------------.  .----------------.  .-----------------. .----------------.  .----------------.  .----------------.  .----------------.  .----------------.   .----------------.  .----------------.
| .--------------. || .--------------. || .--------------. || .--------------. || .--------------. || .--------------. || .--------------. || .--------------. || .--------------. || .--------------. | | .--------------. || .--------------. |
| |  ____  ____  | || |      __      | || |     ______   | || |  ___  ____   | || | ____  _____  | || |     ____     | || |  _________   | || |  _________   | || |    _______   | || |      _       | | | |    _____     | || |   _______    | |
| | |_   ||   _| | || |     /  \     | || |   .' ___  |  | || | |_  ||_  _|  | || ||_   \|_   _| | || |   .'    \`.   | || | |  _   _  |  | || | |  _   _  |  | || |   /  ___  |  | || |     | |      | | | |   / ___ \`.   | || |  |  _____|   | |
| |   | |__| |   | || |    / /\ \    | || |  / .'   \_|  | || |   | |_/ /    | || |  |   \ | |   | || |  /  .--.  \  | || | |_/ | | \_|  | || | |_/ | | \_|  | || |  |  (__ \_|  | || |     \_|      | | | |  |_/___) |   | || |  | |____     | |
| |   |  __  |   | || |   / ____ \   | || |  | |         | || |   |  __'.    | || |  | |\ \| |   | || |  | |    | |  | || |     | |      | || |     | |      | || |   '.___\`-.   | || |              | | | |   .'____.'   | || |  '_.____''.  | |
| |  _| |  | |_  | || | _/ /    \ \_ | || |  \ \`.___.'\\  | || |  _| |  \ \_  | || | _| |_\   |_  | || |  \  \`--'  /  | || |    _| |_     | || |    _| |_     | || |  |\`\____) |  | || |              | | | |  / /____     | || |  | \____) |  | |
| | |____||____| | || ||____|  |____|| || |   \`._____.'  | || | |____||____| | || ||_____|\____| | || |   \`.____.'   | || |   |_____|    | || |   |_____|    | || |  |_______.'  | || |              | | | |  |_______|   | || |   \______.'  | |
| |              | || |              | || |              | || |              | || |              | || |              | || |              | || |              | || |              | || |              | | | |              | || |              | |
| '--------------' || '--------------' || '--------------' || '--------------' || '--------------' || '--------------' || '--------------' || '--------------' || '--------------' || '--------------' | | '--------------' || '--------------' |
 '----------------'  '----------------'  '----------------'  '----------------'  '----------------'  '----------------'  '----------------'  '----------------'  '----------------'  '----------------'   '----------------'  '----------------'
`;

// Compact and clean HackNotts logo for smaller displays
export const compactLogo = `
 _  _         _   _      _   _        ___  ___ ___ ___
| || |__ _ __| |_| |_  _| |_| |_ ___ |_  )/ _ \\_  ) __|
| __ / _\` / _| / / ' \\/ _ \\  _(_-<  / / | (_) |/ /\\__ \\
|_||_\\__,_\\__|_\\_\\_||_\\___/\\__/__/ /___(_)___/___|___/
`;

// Fun decorative banner for the hackathon spirit
export const decorativeBanner = `
╔═══════════════════════════════════════════════════════════════════════════╗
║  🎉  Welcome to HackNotts 2025 CLI - Where Ideas Come to Life!  🎉      ║
║  📅 October 25-26 | 24-Hour Hackathon | University of Nottingham        ║
║  💡 For all skill levels • Friendly competition • Playful cleverness     ║
╚═══════════════════════════════════════════════════════════════════════════╝`;

// Simple decorative elements
export const headerDecoration = `
╭────────────────────────────────────────────────────────────────╮`;

export const footerDecoration = `
╰────────────────────────────────────────────────────────────────╯`;

// Cute robot mascot ASCII art
export const robotMascot = `
    ___
   |___|
   |o o|   <- HackNotts AI Assistant
   | u |   Ready to help you build amazing things!
   |___|
  _|   |_
`;

// Inspirational quotes for hackers
export const inspirationalQuotes = [
  "💭 'The only way to do great work is to love what you do.' - Steve Jobs",
  "🚀 'Code is like humor. When you have to explain it, it's bad.' - Cory House",
  "✨ 'First, solve the problem. Then, write the code.' - John Johnson",
  "🎯 'Make it work, make it right, make it fast.' - Kent Beck",
  "🔥 'The best error message is the one that never shows up.' - Thomas Fuchs",
  "💡 'Programming isn't about what you know; it's about what you can figure out.'",
  "🌟 'Every expert was once a beginner.' - Keep learning!",
  "⚡ 'Simplicity is the soul of efficiency.' - Austin Freeman"
];

// ASCII 字符画数组
const asciiLogos = [standardAsciiLogo, blocksAsciiLogo, compactLogo];

/**
 * 随机获取一个 ASCII 字符画
 */
export const getRandomAsciiLogo = (): string => {
  const randomIndex = Math.floor(Math.random() * asciiLogos.length);
  return asciiLogos[randomIndex];
};

/**
 * 获取随机励志名言
 */
export const getRandomQuote = (): string => {
  const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
  return inspirationalQuotes[randomIndex];
};
